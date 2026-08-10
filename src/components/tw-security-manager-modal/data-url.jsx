import React from 'react';
import PropTypes from 'prop-types';
import styles from './data-url.css';

/**
 * @param {string} dataURI data: URI
 * @returns {string} A hopefully human-readable version
 */
const decodeDataURI = dataURI => {
    const delimeter = dataURI.indexOf(',');
    if (delimeter === -1) {
        return dataURI;
    }
    const contentType = dataURI.substring(0, delimeter);
    const data = dataURI.substring(delimeter + 1);
    if (contentType.endsWith(';base64')) {
        try {
            
            const binaryString = atob(data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(bytes);
        } catch (e) {
            return dataURI;
        }
    }
    try {
        return decodeURIComponent(data);
    } catch (e) {
        return dataURI;
    }
};

const DataURL = props => (
    <textarea
        className={styles.code}
        value={decodeDataURI(props.url)}
        readOnly
        spellCheck={false}
        autoComplete="off"
    />
);

DataURL.propTypes = {
    url: PropTypes.string.isRequired
};

export default DataURL;
