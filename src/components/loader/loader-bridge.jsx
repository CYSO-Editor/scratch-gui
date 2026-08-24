import React from 'react';
import PropTypes from 'prop-types';

class LoaderBridge extends React.Component {
  subscribe() {
    const vm = this.props.vm;
    if (!vm) return;
    this.lastEmit = 0;
    this.onAsset = (finished, total) => {
      const now = performance.now();
      if (now - this.lastEmit < 60 && finished < total) return;
      this.lastEmit = now;
      window.dispatchEvent(new CustomEvent('cyso:load-progress', {
        detail: {
          finished,
          total,
          isRemote: this.props.isRemote
        }
      }));
    };
    this.onProject = () => {
      window.dispatchEvent(new CustomEvent('cyso:load-done'));
    };
    vm.on('ASSET_PROGRESS', this.onAsset);
    vm.runtime.on('PROJECT_LOADED', this.onProject);
  }

  unsubscribe() {
    const vm = this.props.vm;
    if (!vm || !this.onAsset) return;
    vm.removeListener('ASSET_PROGRESS', this.onAsset);
    vm.runtime.removeListener('PROJECT_LOADED', this.onProject);
  }

  componentDidMount() {
    this.subscribe();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.vm !== this.props.vm) {
      this.unsubscribe();
      this.subscribe();
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return null;
  }
}

LoaderBridge.propTypes = {
  vm: PropTypes.object,
  isRemote: PropTypes.bool
};

export default LoaderBridge;
