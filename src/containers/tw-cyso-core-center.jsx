import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import CYSOCoreCenterModal from '../components/tw-cyso-core-center/index.jsx';
import {closeCYSOCoreCenter} from '../reducers/modals';
import {
    setDefaultPermission,
    setExtensionPermission
} from '../reducers/tw';
import {
    loadDefaults,
    saveDefaults,
    loadExtensionPermissions,
    saveExtensionPermissions,
    PERMISSION_GROUPS
} from '../lib/extension-permissions';

class CYSOCoreCenter extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleDefaultPermissionChange',
            'handleExtensionPermissionChange',
            'handleSelectView'
        ]);
        this.state = {
            activeView: 'defaults'
        };
    }

    componentDidMount () {
        const defaults = loadDefaults();
        Object.entries(defaults).forEach(([permType, setting]) => {
            if (setting) this.props.setDefaultPermission(permType, setting);
        });
    }

    handleSelectView (view) {
        this.setState({activeView: view});
    }

    
    handleDefaultPermissionChange (permissionType, setting) {
        this.props.setDefaultPermission(permissionType, setting);
        saveDefaults({ [permissionType]: setting });

        if (typeof EditorPreload !== 'undefined' && EditorPreload.setDefault) {
            EditorPreload.setDefault(permissionType, setting);
        }
    }

    
    handleExtensionPermissionChange (extensionId, permissionType, setting) {
        this.props.setExtensionPermission(extensionId, permissionType, setting);

        const current = loadExtensionPermissions(extensionId);
        const next = Object.assign({}, current, { [permissionType]: setting });
        saveExtensionPermissions(extensionId, next);

        const runtime = this.props.vm && this.props.vm.runtime;
        if (runtime) {
            runtime.extensionPermissions = runtime.extensionPermissions || {};
            runtime.extensionPermissions[extensionId] = next;
        }

        if (typeof EditorPreload !== 'undefined' && EditorPreload.setExtensionPermission) {
            EditorPreload.setExtensionPermission(extensionId, permissionType, setting);
        }

        if (runtime && runtime.cysoCoreEnabled && this.props.vm.storeCYSOConfig) {
            this.props.vm.storeCYSOConfig();
        }
    }

    render () {
        if (!this.props.cysoCoreCenterOpen) {
            return null;
        }

        const isDarkMode = typeof document !== 'undefined' && (
            document.documentElement.classList.contains('tw-misty-sand-dark') ||
            document.documentElement.classList.contains('tw-dark-theme')
        );

        return (
            <CYSOCoreCenterModal
                PERMISSION_GROUPS={PERMISSION_GROUPS}
                defaults={this.props.defaults}
                loadedExtensions={this.props.loadedExtensions}
                extensionPermissions={this.props.extensionPermissions}
                activeView={this.state.activeView}
                onSelectView={this.handleSelectView}
                onDefaultPermissionChange={this.handleDefaultPermissionChange}
                onExtensionPermissionChange={this.handleExtensionPermissionChange}
                onClose={this.props.closeCYSOCoreCenter}
                isDarkMode={isDarkMode}
            />
        );
    }
}

CYSOCoreCenter.propTypes = {
    cysoCoreCenterOpen: PropTypes.bool,
    defaults: PropTypes.object,
    loadedExtensions: PropTypes.array,
    extensionPermissions: PropTypes.object,
    closeCYSOCoreCenter: PropTypes.func.isRequired,
    setDefaultPermission: PropTypes.func.isRequired,
    setExtensionPermission: PropTypes.func.isRequired,
    vm: PropTypes.object,
    theme: PropTypes.object
};

CYSOCoreCenter.defaultProps = {
    cysoCoreCenterOpen: false,
    defaults: {},
    loadedExtensions: [],
    extensionPermissions: {},
    vm: null,
    theme: null
};

const mapStateToProps = state => ({
    cysoCoreCenterOpen: state.scratchGui.modals.cysoCoreCenter,
    defaults: state.scratchGui.tw.defaults,
    loadedExtensions: state.scratchGui.tw.loadedExtensions,
    extensionPermissions: state.scratchGui.tw.extensionPermissions,
    vm: state.scratchGui.vm,
    theme: state.scratchGui.theme && state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    closeCYSOCoreCenter: () => dispatch(closeCYSOCoreCenter()),
    setDefaultPermission: (permissionType, setting) =>
        dispatch(setDefaultPermission(permissionType, setting)),
    setExtensionPermission: (extensionId, permissionType, setting) =>
        dispatch(setExtensionPermission(extensionId, permissionType, setting))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CYSOCoreCenter);
