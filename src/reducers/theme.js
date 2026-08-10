import {detectTheme} from '../lib/themes/themePersistance';
import {getCurrent} from '../lib/themes/customTheme';

const SET_THEME = 'scratch-gui/theme/SET_THEME';
const SET_CUSTOM_THEME = 'scratch-gui/theme/SET_CUSTOM_THEME';

const initialState = {
    theme: detectTheme(),
    customTheme: getCurrent()
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
    case SET_THEME:
        return {...state, theme: action.theme};
    case SET_CUSTOM_THEME:
        return {...state, customTheme: action.customTheme};
    default:
        return state;
    }
};

const setTheme = theme => ({
    type: SET_THEME,
    theme
});

const setCustomTheme = customTheme => ({
    type: SET_CUSTOM_THEME,
    customTheme
});

export {
    reducer as default,
    initialState as themeInitialState,
    setTheme,
    setCustomTheme
};
