import PropTypes from 'prop-types';
import React, {Component} from 'react';
import styles from './styles.css';

class Tooltip extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isVisible: false
        };
        this.wrapperRef = React.createRef();
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
    }

    handleMouseEnter() {
        this.setState({isVisible: true});
    }

    handleMouseLeave() {
        this.setState({isVisible: false});
    }

    render() {
        const {children, content, position} = this.props;
        const {isVisible} = this.state;
        const positionClass = position ? `tooltip${position.charAt(0).toUpperCase() + position.slice(1)}` : 'tooltipTop';

        return (
            <span 
                className={styles.tooltipWrapper}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                ref={this.wrapperRef}
            >
                {children}
                {isVisible && (
                    <div className={`${styles.tooltip} ${styles[positionClass]}`}>
                        <div className={styles.tooltipContent}>
                            {content}
                            <div className={styles.tooltipArrow} />
                        </div>
                    </div>
                )}
            </span>
        );
    }
}

Tooltip.propTypes = {
    children: PropTypes.node.isRequired,
    content: PropTypes.string.isRequired,
    position: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

Tooltip.defaultProps = {
    position: 'top'
};

export default Tooltip;
