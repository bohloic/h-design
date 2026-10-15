import React from 'react';
import { createGlobalStyle } from 'styled-components';
import { useTheme } from '../hooks';

const StyledGlobalStyle = createGlobalStyle<{ isDarkMode?: boolean }>`
    * {
      font-family: 'Trebuchet MS', Helvetica, sans-serif;
    }

    body {
        background-color: #F8FAFC;
        margin: 0;
    }
`;

function GlobalStyle() {
  return <StyledGlobalStyle isDarkMode={false} />;
}

export default GlobalStyle;
