import * as React from 'react';
import PropTypes from 'prop-types';

const SvgForm = ({ size }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        height={size}
        width={size}
        viewBox="0 0 24 24"
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
    >
        <path fill="none" d="M0 0h24v24H0z"></path>
        <path d="M13 11H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h9v7zM4 9h7V6H4v3zm11 11H4c-1.1 0-2-.9-2-2v-3c0-1.1.9-2 2-2h11v7zM4 18h9v-3H4v3zm18-9h-2l2-5h-7v7h2v9l5-11zM4.75 17.25h1.5v-1.5h-1.5v1.5zm0-9h1.5v-1.5h-1.5v1.5z">
        </path>
    </svg>
);

SvgForm.defaultProps = {
    size: 48
};

SvgForm.propTypes = {
    // optional
    size: PropTypes.number
};

export default React.memo(SvgForm);
