import React from 'react';
import PropTypes from 'prop-types';
import styles from './aurora-splash.css';
import {isScratchDesktop} from '../../lib/isScratchDesktop';
import {getCurrent as getCustomTheme} from '../../lib/themes/customTheme';

const STATUS_INIT = '正在初始化…';
const STATUS_PARSE = '正在解析项目…';
const STATUS_PROJECT = '正在读取项目…';
const STATUS_BUILD = '正在构建编辑器…';
const STATUS_ASSETS = '正在准备素材…';
const STATUS_LOAD = '正在加载素材 (';
const STATUS_DOWNLOAD = '正在下载素材 (';
const STATUS_READY = '即将完成…';

/**
 * The progress bar is driven by a target ("goal") that stages raise as loading advances, so the
 * displayed value eases toward it instead of jumping. Percentages below are the bar's own scale,
 * not wall-clock estimates: each one marks the point where that stage is known to have begun.
 *
 * gui.html runs the same ladder for the phase before React mounts and hands the value over through
 * the cyso:load-handoff event, so the bar keeps climbing continuously across the boundary.
 */
const STAGE_GOAL = {
  init: 10,
  bundle: 22,
  dom: 32,
  handoff: 40,
  parse: 58,
  project: 66,
  assets: 76,
  build: 88
};

const ASSET_GOAL_MIN = 76;
const ASSET_GOAL_MAX = 92;
const GOAL_CAP = 96;
const GOAL_DONE = 100;

const PROGRESS_THROTTLE = 60;
const WATCHDOG_MS = 20000;
const EXIT_FADE_MS = 700;

const readTheme = () => {
  let theme = 'aurora';
  let accent = '#4F8EC2';
  try {
    const saved = localStorage.getItem('tw:theme');
    if (saved === 'light' || saved === 'dark') {
      theme = saved;
    } else if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.accent === 'purple') accent = '#855cd6';
      else if (parsed.accent === 'blue') accent = '#4c97ff';
      if (['dark', 'light', 'aurora', 'misty-sand'].indexOf(parsed.gui) !== -1) {
        theme = parsed.gui;
      }
      if (theme === 'misty-sand' && getCustomTheme().darkMode) {
        theme = 'misty-sand-dark';
      }
    }
  } catch (e) {
    // Corrupted or unavailable storage falls back to the defaults above.
  }
  return {theme, accent};
};

class AuroraSplash extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      visible: false,
      done: false,
      theme: 'aurora',
      accent: '#4F8EC2'
    };
    this.rootRef = React.createRef();
    this.pctRef = React.createRef();
    this.statusRef = React.createRef();

    this.progress = 0;
    this.goal = STAGE_GOAL.init;
    this.status = STATUS_INIT;
    this.renderedStatus = '';
    this.pendingFinish = false;
    this.hasCompleted = false;
    this.bootPending = true;
    this.handoffProgress = 0;
    this.mounted = false;
    this.themeApplied = false;
    this.raf = 0;
    this.watchdog = 0;
    this.exitTimer = 0;
    this.lastTs = 0;
    this.lastEmit = 0;

    this.tick = this.tick.bind(this);
    this.onProgress = this.onProgress.bind(this);
    this.onPhase = this.onPhase.bind(this);
    this.onDone = this.onDone.bind(this);
    this.onHandoff = this.onHandoff.bind(this);
  }

  /** 告知 gui.html 里的加载界面可以退场。 */
  reportReady () {
    if (window.cysoReactSplashReady) return;
    window.cysoReactSplashReady = true;
    window.dispatchEvent(new CustomEvent('cyso:react-splash-ready'));
  }

  componentDidMount () {
    this.mounted = true;
    window.addEventListener('cyso:load-handoff', this.onHandoff);
    window.addEventListener('cyso:load-progress', this.onProgress);
    window.addEventListener('cyso:load-phase', this.onPhase);
    window.addEventListener('cyso:load-done', this.onDone);
    if (window.cysoBootDone) {
      // gui.html 里的加载界面已经退场，这里必须立刻顶上，否则会露出还没构建完的主界面。
      this.ensureVisible();
      this.goal = Math.max(this.goal, STAGE_GOAL.handoff);
      this.armWatchdog();
      this.startLoop();
    } else if (this.props.active && this.shouldShow()) {
      this.show();
    }
    this.reportReady();
  }

  componentWillUnmount () {
    this.mounted = false;
    window.removeEventListener('cyso:load-handoff', this.onHandoff);
    window.removeEventListener('cyso:load-progress', this.onProgress);
    window.removeEventListener('cyso:load-phase', this.onPhase);
    window.removeEventListener('cyso:load-done', this.onDone);
    this.clearTimers();
  }

  componentDidUpdate (prevProps) {
    if (!prevProps.active && this.props.active) {
      if (this.bootPending) {
        // 首屏期间 active 会抖动，重置进度会让加载界面闪一下。
        this.ensureVisible();
        this.armWatchdog();
        this.startLoop();
        return;
      }
      // 只响应用户发起的加载，状态机自行推进的 loading 会让加载界面在就绪后重新出现。
      if (!this.props.userInitiated) return;
      this.reset();
      if (this.shouldShow()) {
        this.show();
      }
    } else if (prevProps.active && !this.props.active &&
        this.state.visible && !this.bootPending) {
      this.onDone();
    }
  }

  clearTimers () {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = 0;
    }
    if (this.exitTimer) {
      clearTimeout(this.exitTimer);
      this.exitTimer = 0;
    }
  }

  reset () {
    this.clearTimers();
    this.pendingFinish = false;
    this.hasCompleted = false;
    this.status = STATUS_INIT;
    this.renderedStatus = '';
    this.lastEmit = 0;
    this.themeApplied = false;
    if (this.bootPending) {
      this.progress = Math.max(this.progress, this.handoffProgress);
      this.goal = Math.max(this.goal, STAGE_GOAL.handoff);
    } else {
      this.progress = 0;
      this.goal = STAGE_GOAL.init;
    }
  }

  shouldShow () {
    if (this.bootPending) return true;
    return !(isScratchDesktop() === true && !window.cysoBootDone);
  }

  show () {
    this.ensureVisible();
    this.goal = Math.max(this.goal, STAGE_GOAL.bundle);
    this.setStatus(STATUS_INIT);
    this.armWatchdog();
    this.startLoop();
  }

  ensureVisible () {
    if (!this.themeApplied) {
      this.applyTheme();
      this.themeApplied = true;
    }
    if (!this.state.visible && this.mounted) {
      this.setState({visible: true});
    }
  }

  applyTheme () {
    const {theme, accent} = readTheme();
    if (theme !== this.state.theme || accent !== this.state.accent) {
      this.setState({theme, accent});
    }
    const root = this.rootRef.current;
    if (root) {
      root.setAttribute('data-theme', theme);
      root.style.setProperty('--accent', accent);
    }
  }

  setStatus (text) {
    if (this.renderedStatus === text) return;
    this.renderedStatus = text;
    if (this.statusRef.current) {
      this.statusRef.current.textContent = text;
    }
  }

  renderProgress () {
    const root = this.rootRef.current;
    if (!root) return;
    root.style.setProperty('--p', (this.progress / 100).toFixed(4));
    const pct = this.pctRef.current;
    if (pct) {
      pct.textContent = `${Math.round(this.progress)}%`;
    }
    const track = root.querySelector(`.${styles.progressTrack}`);
    if (track) {
      track.setAttribute('aria-valuenow', String(Math.round(this.progress)));
    }
  }

  startLoop () {
    if (this.raf) return;
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  tick (ts) {
    this.raf = 0;
    if (!this.mounted) return;
    const dt = Math.min(64, ts - this.lastTs) / 1000;
    this.lastTs = ts;
    const diff = this.goal - this.progress;
    if (Math.abs(diff) < 0.15) {
      if (this.pendingFinish && this.progress >= 99.4) {
        this.progress = GOAL_DONE;
        this.renderProgress();
        this.finish();
      }
      return;
    }
    this.progress += diff * Math.min(1, dt * 5);
    if (!this.pendingFinish && this.progress > GOAL_CAP) {
      this.progress = GOAL_CAP;
    }
    this.renderProgress();
    this.raf = requestAnimationFrame(this.tick);
  }

  armWatchdog () {
    if (this.watchdog) {
      clearTimeout(this.watchdog);
    }
    this.watchdog = window.setTimeout(this.onDone, WATCHDOG_MS);
  }

  finish () {
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = 0;
    }
    this.setState({done: true});
    this.setStatus(STATUS_READY);
    this.exitTimer = window.setTimeout(() => {
      this.exitTimer = 0;
      if (!this.mounted) return;
      this.setState({visible: false, done: false});
      this.bootPending = false;
      this.handoffProgress = 0;
      this.progress = 0;
      this.goal = STAGE_GOAL.init;
      this.pendingFinish = false;
      this.renderProgress();
      this.setStatus(STATUS_INIT);
    }, EXIT_FADE_MS);
  }

  onHandoff (e) {
    if (this.hasCompleted || this.pendingFinish) return;
    this.ensureVisible();
    const detail = (e && e.detail) || {};
    this.handoffProgress = Math.max(this.handoffProgress, Number(detail.progress) || STAGE_GOAL.handoff);
    this.bootPending = true;
    this.progress = Math.max(this.progress, this.handoffProgress);
    this.goal = Math.max(this.goal, STAGE_GOAL.handoff);
    this.setStatus(detail.status || STATUS_INIT);
    this.armWatchdog();
    this.startLoop();
  }

  onPhase (e) {
    if ((!this.props.active && !this.bootPending) || !this.shouldShow()) return;
    const now = performance.now();
    if (now - this.lastEmit < PROGRESS_THROTTLE) return;
    this.lastEmit = now;
    const phase = e && e.detail;
    if (phase === 'parse') {
      this.goal = Math.max(this.goal, STAGE_GOAL.parse);
      this.setStatus(STATUS_PARSE);
    } else if (phase === 'default' || phase === 'project') {
      // 这两个阶段之后紧接主进程读文件，期间没有更细的进度可报。
      this.goal = Math.max(this.goal, STAGE_GOAL.project);
      this.setStatus(STATUS_PROJECT);
    } else if (phase === 'assets') {
      this.goal = Math.max(this.goal, STAGE_GOAL.assets);
      this.setStatus(STATUS_ASSETS);
    } else if (phase === 'build') {
      this.goal = Math.max(this.goal, STAGE_GOAL.build);
      this.setStatus(STATUS_BUILD);
    } else {
      return;
    }
    this.ensureVisible();
    this.armWatchdog();
    this.startLoop();
  }

  onProgress (e) {
    if ((!this.props.active && !this.bootPending) || !this.shouldShow()) return;
    const now = performance.now();
    if (now - this.lastEmit < PROGRESS_THROTTLE) return;
    this.lastEmit = now;
    this.ensureVisible();
    const d = (e && e.detail) || {};
    if (!d.total) {
      this.goal = Math.max(this.goal, STAGE_GOAL.assets);
      this.setStatus(STATUS_PARSE);
    } else {
      const ratio = Math.max(0, Math.min(1, d.finished / d.total));
      this.goal = Math.min(ASSET_GOAL_MAX, ASSET_GOAL_MIN + ratio * (ASSET_GOAL_MAX - ASSET_GOAL_MIN));
      this.setStatus((d.isRemote ? STATUS_DOWNLOAD : STATUS_LOAD) + `${d.finished}/${d.total})…`);
    }
    this.armWatchdog();
    this.startLoop();
  }

  onDone () {
    if (!this.hasCompleted) {
      this.hasCompleted = true;
      window.dispatchEvent(new CustomEvent('cyso:load-complete'));
    }
    if (!this.state.visible) return;
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = 0;
    }
    this.pendingFinish = true;
    this.goal = GOAL_DONE;
    this.setStatus(STATUS_READY);
    this.startLoop();
  }

  render () {
    if (!this.state.visible) return null;
    const rootClass = this.state.done ?
      `${styles.splashScreen} ${styles.splashDone}` :
      styles.splashScreen;
    return (
      <div
        className={rootClass}
        ref={this.rootRef}
        data-theme={this.state.theme}
        style={{'--accent': this.state.accent}}
      >
        <div className={styles.auroraField} />

        <div className={styles.brand}>
          <div className={styles.brandLogo}>CY<b>SO</b></div>
          <div className={styles.brandSub}>CYSOEditor</div>
        </div>

        <div className={styles.progressFoot}>
          <div className={styles.progressRow}>
            <div
              className={styles.progressStatus}
              ref={this.statusRef}
              role="status"
              aria-live="polite"
            >
              {this.status}
            </div>
            <b className={styles.progressPct} ref={this.pctRef}>0%</b>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(this.progress)}
            aria-label="项目载入进度"
          >
            <div className={styles.progressFill} />
          </div>
        </div>
      </div>
    );
  }
}

AuroraSplash.propTypes = {
  active: PropTypes.bool,
  userInitiated: PropTypes.bool
};

export default AuroraSplash;