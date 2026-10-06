import React from 'react';
import PropTypes from 'prop-types';

const PROGRESS_INTERVAL = 60;

class LoaderBridge extends React.Component {
  constructor(props) {
    super(props);
    this.subscribedVm = null;
    this.lastEmit = 0;
    this.onAsset = this.onAsset.bind(this);
    this.onPhase = this.onPhase.bind(this);
    this.onProject = this.onProject.bind(this);
  }

  componentDidMount() {
    this.subscribe(this.props.vm);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.vm !== this.props.vm || prevProps.isRemote !== this.props.isRemote) {
      this.unsubscribe();
      this.subscribe(this.props.vm);
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  subscribe(vm) {
    if (!vm) return;
    this.subscribedVm = vm;
    this.lastEmit = 0;
    vm.on('ASSET_PROGRESS', this.onAsset);
    vm.on('CYSO_LOAD_PHASE', this.onPhase);
    vm.runtime.on('PROJECT_LOADED', this.onProject);
  }

  unsubscribe() {
    const vm = this.subscribedVm;
    if (!vm) return;
    vm.removeListener('ASSET_PROGRESS', this.onAsset);
    vm.removeListener('CYSO_LOAD_PHASE', this.onPhase);
    vm.runtime.removeListener('PROJECT_LOADED', this.onProject);
    this.subscribedVm = null;
  }

  onAsset(finished, total) {
    const now = performance.now();
    if (now - this.lastEmit < PROGRESS_INTERVAL && finished < total) return;
    this.lastEmit = now;
    window.dispatchEvent(new CustomEvent('cyso:load-progress', {
      detail: {
        finished,
        total,
        isRemote: this.props.isRemote
      }
    }));
  }

  onPhase(phase) {
    window.dispatchEvent(new CustomEvent('cyso:load-phase', {
      detail: phase
    }));
  }

  onProject() {
    if (this.props.active === false) return;
    window.dispatchEvent(new CustomEvent('cyso:load-done'));
  }

  render() {
    return null;
  }
}

LoaderBridge.propTypes = {
  vm: PropTypes.object,
  active: PropTypes.bool,
  isRemote: PropTypes.bool
};

export default LoaderBridge;