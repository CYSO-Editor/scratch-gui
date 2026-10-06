import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {injectIntl, intlShape} from 'react-intl';

import {connect} from 'react-redux';
import {moveMonitorRect, resetMonitorLayout} from '../reducers/monitor-layout';

import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import OpcodeLabels from '../lib/opcode-labels';

import MonitorListComponent from '../components/monitor-list/monitor-list.jsx';

const monitorsShallowEqual = (prev, next) => {
    if (prev === next) return true;
    if (!prev || !next) return false;
    // Some projects produce monitor state that doesn't implement the full collection API, so don't
    // assume Map: fall back to "assume different" rather than throwing while rendering.
    if (typeof next.keys !== 'function' || typeof prev.get !== 'function') return false;
    if (prev.size !== next.size) return false;
    for (const key of next.keys()) {
        if (prev.get(key) !== next.get(key)) {
            return false;
        }
    }
    return true;
};

class MonitorList extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleMonitorChange'
        ]);
        OpcodeLabels.setTranslatorFunction(props.intl.formatMessage);
        this.state = {
            key: 0
        };
    }
    componentWillReceiveProps (nextProps) {
        // TW: When stage size changes, we'll force all monitors to re-render completely
        // This is important because the VM moves monitors after resize to preserve locations but
        // Scratch's monitor layout logic is very complex and it won't notice that
        if (this.props.customStageSize !== nextProps.customStageSize) {
            this.props.resetMonitorLayout();
            this.setState({
                key: this.state.key + 1
            });
        }
    }
    shouldComponentUpdate (nextProps, nextState) {
        if (nextProps.monitors !== this.props.monitors) {
            if (!monitorsShallowEqual(this.props.monitors, nextProps.monitors)) {
                return true;
            }
        }
        for (const key in nextProps) {
            if (key === 'monitors') continue;
            if (nextProps[key] !== this.props[key]) {
                return true;
            }
        }
        return nextState.key !== this.state.key;
    }
    handleMonitorChange (id, x, y) { // eslint-disable-line no-unused-vars
        this.props.moveMonitorRect(id, x, y);
    }
    render () {
        return (
            <MonitorListComponent
                onMonitorChange={this.handleMonitorChange}
                key={this.state.key}
                {...this.props}
            />
        );
    }
}

MonitorList.propTypes = {
    intl: intlShape.isRequired,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    monitorLayout: PropTypes.shape({
        monitors: PropTypes.object, // eslint-disable-line react/forbid-prop-types
        savedMonitorPositions: PropTypes.object // eslint-disable-line react/forbid-prop-types
    }).isRequired,
    moveMonitorRect: PropTypes.func.isRequired,
    resetMonitorLayout: PropTypes.func
};
const mapStateToProps = state => ({
    customStageSize: state.scratchGui.customStageSize,
    monitors: state.scratchGui.monitors,
    monitorLayout: state.scratchGui.monitorLayout
});
const mapDispatchToProps = dispatch => ({
    moveMonitorRect: (id, x, y) => dispatch(moveMonitorRect(id, x, y)),
    resetMonitorLayout: () => dispatch(resetMonitorLayout())
});

export default errorBoundaryHOC('Monitors')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(MonitorList))
);
