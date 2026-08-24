import React from 'react';
import PropTypes from 'prop-types';
import styles from './aurora-splash.css';
import {isScratchDesktop} from '../../lib/isScratchDesktop';
import {getCurrent as getCustomTheme} from '../../lib/themes/customTheme';

const STATUS_INIT = '正在初始化…';
const STATUS_PARSE = '正在解析项目…';
const STATUS_LOAD = '正在加载素材 (';
const STATUS_DOWNLOAD = '正在下载素材 (';
const STATUS_READY = '即将完成…';
const DIRS = ['dirR', 'dirL', 'dirU', 'dirD'];

function readTheme() {
  let theme = 'aurora';
  let accent = '#4F8EC2';
  try {
    const saved = localStorage.getItem('tw:theme');
    if (saved === 'light' || saved === 'dark') {
      theme = saved;
    } else if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.accent === 'purple') accent = '#855cd6';
        else if (parsed.accent === 'blue') accent = '#4c97ff';
        if (['dark', 'light', 'aurora', 'misty-sand'].indexOf(parsed.gui) !== -1) {
          theme = parsed.gui;
        }
        if (theme === 'misty-sand' && getCustomTheme().darkMode) {
          theme = 'misty-sand-dark';
        }
        } catch (e) {}
    }
  } catch (e) {}
  return { theme, accent };
}

class AuroraSplash extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      done: false,
      status: STATUS_INIT,
      theme: 'aurora',
      accent: '#4F8EC2'
    };
    this.rootRef = React.createRef();
    this.pctRef = React.createRef();
    this.statusRef = React.createRef();
    this.streamRef = React.createRef();

    this.progress = 0;
    this.goal = 22;
    this.pendingFinish = false;
    this.raf = 0;
    this.watchdog = 0;
    this.lastTs = 0;
    this.themeApplied = false;
    this.lastProgTs = 0;
    this._lastStatus = '';
    this.dir = 'dirR';
    this.lastMilestone = -1;
    this.hasCompleted = false;
    this.reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    this.tick = this.tick.bind(this);
    this.onProgress = this.onProgress.bind(this);
    this.onDone = this.onDone.bind(this);
  }

  componentDidMount() {
    window.addEventListener('cyso:load-progress', this.onProgress);
    window.addEventListener('cyso:load-done', this.onDone);
    if (this.props.active && this.shouldShow()) {
      this.show();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('cyso:load-progress', this.onProgress);
    window.removeEventListener('cyso:load-done', this.onDone);
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.watchdog) clearTimeout(this.watchdog);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.active && this.props.active) {
      this.pendingFinish = false;
      this.goal = 22;
      this.progress = 0;
      this.lastMilestone = -1;
      this.lastProgTs = 0;
      this.hasCompleted = false;
      this.themeApplied = false;
      if (this.watchdog) {
        clearTimeout(this.watchdog);
        this.watchdog = 0;
      }
      if (this.shouldShow()) {
        this.show();
      }
    } else if (prevProps.active && !this.props.active && this.state.visible) {
      this.onDone();
    }
  }

  shouldShow() {
    if (isScratchDesktop() === true && !window.cysoBootDone) return false;
    return true;
  }

  show() {
    this.applyTheme();
    this.themeApplied = true;
    this.setState({ visible: true });
    this.startIndeterminate();
  }

  startIndeterminate() {
    if (this.watchdog) {
      clearTimeout(this.watchdog);
    }
    this.goal = Math.max(this.goal, 40);
    this.setStatus(STATUS_INIT);
    this.startLoop();
    this.watchdog = window.setTimeout(() => this.onDone(), 12000);
  }

  applyTheme() {
    const { theme, accent } = readTheme();
    if (theme !== this.state.theme || accent !== this.state.accent) {
      this.setState({ theme, accent });
    }
    if (this.rootRef.current) {
      this.rootRef.current.setAttribute('data-theme', theme);
      this.rootRef.current.style.setProperty('--accent', accent);
    }
  }

  setStatus(text) {
    if (this._lastStatus === text) return;
    this._lastStatus = text;
    if (this.statusRef.current) {
      this.statusRef.current.textContent = text;
    }
  }

  setDir(next) {
    if (next === this.dir) return;
    this.dir = next;
    if (this.streamRef.current) {
      this.streamRef.current.className = `${styles.auroraStream} ${styles[next]}`;
    }
  }

  randomDir() {
    this.setDir(DIRS[(Math.random() * DIRS.length) | 0]);
  }

  applyProgress() {
    const p = Math.max(0, Math.min(100, this.progress));
    if (this.rootRef.current) {
      this.rootRef.current.style.setProperty('--p', `${p}%`);
    }
    if (this.pctRef.current) {
      this.pctRef.current.textContent = `${Math.round(p)}%`;
    }
    const ms = Math.floor(p / 15);
    if (ms !== this.lastMilestone) {
      this.lastMilestone = ms;
      if (!this.reduceMotion) this.randomDir();
    }
  }

  startLoop() {
    if (this.raf) return;
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  tick(ts) {
    const dt = Math.min(64, ts - this.lastTs) / 1000;
    this.lastTs = ts;
    const diff = this.goal - this.progress;
    if (Math.abs(diff) < 0.15) {
      if (this.pendingFinish && this.progress >= 99.4) {
        this.progress = 100;
        this.applyProgress();
        this.finish();
        return;
      }
      this.raf = 0;
      return;
    }
    this.progress += diff * Math.min(1, dt * 5);
    if (!this.pendingFinish && this.progress > 96) this.progress = 96;
    this.applyProgress();
    this.raf = requestAnimationFrame(this.tick);
  }

  finish() {
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = 0;
    }
    this.setState({ done: true });
    this.setStatus(STATUS_READY);
    setTimeout(() => {
      this.setState({ visible: false, done: false });
      this.progress = 0;
      this.goal = 22;
      this.pendingFinish = false;
      this.lastMilestone = -1;
      if (this.rootRef.current) {
        this.rootRef.current.style.setProperty('--p', '0%');
      }
      if (this.pctRef.current) {
        this.pctRef.current.textContent = '0%';
      }
      this.setStatus(STATUS_INIT);
    }, 700);
  }

  onProgress(e) {
    if (!this.props.active) return;
    if (isScratchDesktop() === true && !window.cysoBootDone) return;
    if (!this.themeApplied) {
      this.applyTheme();
      this.themeApplied = true;
    }
    const now = performance.now();
    if (now - this.lastProgTs < 60) return;
    this.lastProgTs = now;
    const d = (e && e.detail) || {};
    if (!this.state.visible) this.setState({ visible: true });
    if (!d.total) {
      this.goal = Math.max(this.goal, 88);
      this.setStatus(STATUS_PARSE);
    } else {
      this.goal = Math.min(96, 88 + (d.finished / d.total) * 8);
      this.setStatus((d.isRemote ? STATUS_DOWNLOAD : STATUS_LOAD) +
        `${d.finished}/${d.total})…`);
    }
    this.startLoop();
    if (this.watchdog) {
      clearTimeout(this.watchdog);
    }
    this.watchdog = window.setTimeout(() => this.onDone(), 12000);
  }

  onDone() {
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
    this.goal = 100;
    this.setStatus(STATUS_READY);
    this.startLoop();
  }

  render() {
    if (!this.state.visible) return null;
    const rootClass = this.state.done
      ? `${styles.splashScreen} ${styles.splashDone}`
      : styles.splashScreen;
    return (
      <div
        className={rootClass}
        ref={this.rootRef}
        data-theme={this.state.theme}
        style={{ '--accent': this.state.accent }}
      >
        <div className={styles.auroraField}>
          <span className={`${styles.blob} ${styles.blobGreen}`} />
          <span className={`${styles.blob} ${styles.blobPurple}`} />
          <span className={`${styles.blob} ${styles.blobPink}`} />
          <span className={`${styles.blob} ${styles.blobCyan}`} />
          <div
            className={`${styles.auroraStream} ${styles[this.dir]}`}
            ref={this.streamRef}
          />
          <div className={styles.auroraVeil} />
          <div className={styles.auroraVignette} />
        </div>

        <div className={styles.brand}>
          <div className={styles.brandLogo}>CY<b>SO</b></div>
          <div className={styles.brandSub}>CYSOEditor</div>
        </div>

        <div className={styles.progressFoot}>
          <div className={styles.progressLabel}>
            <span>正在载入</span>
            <b className={styles.progressPct} ref={this.pctRef}>0%</b>
          </div>
          <div
            className={styles.progressStatus}
            ref={this.statusRef}
          >
            {this.state.status}
          </div>
        </div>
      </div>
    );
  }
}

AuroraSplash.propTypes = {
  active: PropTypes.bool
};

export default AuroraSplash;
