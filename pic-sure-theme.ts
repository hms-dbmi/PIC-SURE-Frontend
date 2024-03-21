import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const picSureTheme: CustomThemeConfig = {
  name: 'pic-sure-theme',
  properties: {
    // =~= Theme Properties =~=
    '--theme-font-family-base': `system-ui`,
    '--theme-font-family-heading': `system-ui`,
    '--theme-font-color-base': 'var(--color-surface-900)',
    '--theme-font-color-dark': '255 255 255',
    '--theme-rounded-base': '9999px',
    '--theme-rounded-container': '8px',
    '--theme-border-base': '1px',
    // =~= Theme On-X Colors =~=
    '--on-primary': '0 0 0',
    '--on-secondary': '0 0 0',
    '--on-tertiary': '255 255 255',
    '--on-success': '0 0 0',
    '--on-warning': '0 0 0',
    '--on-error': '0 0 0',
    '--on-surface': '0 0 0',
    // =~= Theme Colors  =~=
    // primary | #b0a28c
    '--color-primary-50': '243 241 238', // #f3f1ee
    '--color-primary-100': '239 236 232', // #efece8
    '--color-primary-200': '235 232 226', // #ebe8e2
    '--color-primary-300': '223 218 209', // #dfdad1
    '--color-primary-400': '200 190 175', // #c8beaf
    '--color-primary-500': '176 162 140', // #b0a28c
    '--color-primary-600': '158 146 126', // #9e927e
    '--color-primary-700': '132 122 105', // #847a69
    '--color-primary-800': '106 97 84', // #6a6154
    '--color-primary-900': '86 79 69', // #564f45
    // secondary | #848484
    '--color-secondary-50': '237 237 237', // #ededed
    '--color-secondary-100': '230 230 230', // #e6e6e6
    '--color-secondary-200': '224 224 224', // #e0e0e0
    '--color-secondary-300': '206 206 206', // #cecece
    '--color-secondary-400': '169 169 169', // #a9a9a9
    '--color-secondary-500': '132 132 132', // #848484
    '--color-secondary-600': '119 119 119', // #777777
    '--color-secondary-700': '99 99 99', // #636363
    '--color-secondary-800': '79 79 79', // #4f4f4f
    '--color-secondary-900': '65 65 65', // #414141
    // tertiary | #675AFF
    '--color-tertiary-50': '232 230 255', // #e8e6ff
    '--color-tertiary-100': '225 222 255', // #e1deff
    '--color-tertiary-200': '217 214 255', // #d9d6ff
    '--color-tertiary-300': '194 189 255', // #c2bdff
    '--color-tertiary-400': '149 140 255', // #958cff
    '--color-tertiary-500': '103 90 255', // #675AFF
    '--color-tertiary-600': '93 81 230', // #5d51e6
    '--color-tertiary-700': '77 68 191', // #4d44bf
    '--color-tertiary-800': '62 54 153', // #3e3699
    '--color-tertiary-900': '50 44 125', // #322c7d
    // success | #5cb85c
    '--color-success-50': '231 244 231', // #e7f4e7
    '--color-success-100': '222 241 222', // #def1de
    '--color-success-200': '214 237 214', // #d6edd6
    '--color-success-300': '190 227 190', // #bee3be
    '--color-success-400': '141 205 141', // #8dcd8d
    '--color-success-500': '92 184 92', // #5cb85c
    '--color-success-600': '83 166 83', // #53a653
    '--color-success-700': '69 138 69', // #458a45
    '--color-success-800': '55 110 55', // #376e37
    '--color-success-900': '45 90 45', // #2d5a2d
    // warning | #EAB308
    '--color-warning-50': '252 244 218', // #fcf4da
    '--color-warning-100': '251 240 206', // #fbf0ce
    '--color-warning-200': '250 236 193', // #faecc1
    '--color-warning-300': '247 225 156', // #f7e19c
    '--color-warning-400': '240 202 82', // #f0ca52
    '--color-warning-500': '234 179 8', // #EAB308
    '--color-warning-600': '211 161 7', // #d3a107
    '--color-warning-700': '176 134 6', // #b08606
    '--color-warning-800': '140 107 5', // #8c6b05
    '--color-warning-900': '115 88 4', // #735804
    // error | #FF0000
    '--color-error-50': '255 217 217', // #ffd9d9
    '--color-error-100': '255 204 204', // #ffcccc
    '--color-error-200': '255 191 191', // #ffbfbf
    '--color-error-300': '255 153 153', // #ff9999
    '--color-error-400': '255 77 77', // #ff4d4d
    '--color-error-500': '255 0 0', // #FF0000
    '--color-error-600': '230 0 0', // #e60000
    '--color-error-700': '191 0 0', // #bf0000
    '--color-error-800': '153 0 0', // #990000
    '--color-error-900': '125 0 0', // #7d0000
    // surface | #bababa
    '--color-surface-50': '245 245 245', // #f5f5f5
    '--color-surface-100': '241 241 241', // #f1f1f1
    '--color-surface-200': '238 238 238', // #eeeeee
    '--color-surface-300': '227 227 227', // #e3e3e3
    '--color-surface-400': '207 207 207', // #cfcfcf
    '--color-surface-500': '186 186 186', // #bababa
    '--color-surface-600': '167 167 167', // #a7a7a7
    '--color-surface-700': '140 140 140', // #8c8c8c
    '--color-surface-800': '112 112 112', // #707070
    '--color-surface-900': '91 91 91', // #5b5b5b
  },
};
