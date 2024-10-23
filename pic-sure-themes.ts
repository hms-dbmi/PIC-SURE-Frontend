import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const picsureTheme: CustomThemeConfig = {
  name: 'picsure-theme',
  properties: {
    // =~= Theme Properties =~=
    '--theme-font-family-base': `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
    '--theme-font-family-heading': `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
    '--theme-font-color-base': '0 0 0',
    '--theme-font-color-dark': '255 255 255',
    '--theme-rounded-base': '9999px',
    '--theme-rounded-container': '16px',
    '--theme-border-base': '1px',
    // =~= Theme On-X Colors =~=
    '--on-primary': '255 255 255',
    '--on-secondary': '0 0 0',
    '--on-tertiary': '255 255 255',
    '--on-success': '0 0 0',
    '--on-warning': '0 0 0',
    '--on-error': '255 255 255',
    '--on-surface': '255 255 255',
    // =~= Theme Colors  =~=
    // primary | #244D94
    '--color-primary-50': '222 228 239', // #dee4ef
    '--color-primary-100': '211 219 234', // #d3dbea
    '--color-primary-200': '200 211 228', // #c8d3e4
    '--color-primary-300': '167 184 212', // #a7b8d4
    '--color-primary-400': '102 130 180', // #6682b4
    '--color-primary-500': '36 77 148', // #244D94
    '--color-primary-600': '32 69 133', // #204585
    '--color-primary-700': '27 58 111', // #1b3a6f
    '--color-primary-800': '22 46 89', // #162e59
    '--color-primary-900': '18 38 73', // #122649
    // secondary | #529BC5
    '--color-secondary-50': '229 240 246', // #e5f0f6
    '--color-secondary-100': '220 235 243', // #dcebf3
    '--color-secondary-200': '212 230 241', // #d4e6f1
    '--color-secondary-300': '186 215 232', // #bad7e8
    '--color-secondary-400': '134 185 214', // #86b9d6
    '--color-secondary-500': '82 155 197', // #529BC5
    '--color-secondary-600': '74 140 177', // #4a8cb1
    '--color-secondary-700': '62 116 148', // #3e7494
    '--color-secondary-800': '49 93 118', // #315d76
    '--color-secondary-900': '40 76 97', // #284c61
    // tertiary | #90BB54
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
    // success | #8ed081
    '--color-success-50': '238 248 236', // #eef8ec
    '--color-success-100': '232 246 230', // #e8f6e6
    '--color-success-200': '227 243 224', // #e3f3e0
    '--color-success-300': '210 236 205', // #d2eccd
    '--color-success-400': '176 222 167', // #b0dea7
    '--color-success-500': '142 208 129', // #8ed081
    '--color-success-600': '128 187 116', // #80bb74
    '--color-success-700': '107 156 97', // #6b9c61
    '--color-success-800': '85 125 77', // #557d4d
    '--color-success-900': '70 102 63', // #46663f
    // warning | #ffb140
    '--color-warning-50': '255 243 226', // #fff3e2
    '--color-warning-100': '255 239 217', // #ffefd9
    '--color-warning-200': '255 236 207', // #ffeccf
    '--color-warning-300': '255 224 179', // #ffe0b3
    '--color-warning-400': '255 200 121', // #ffc879
    '--color-warning-500': '255 177 64', // #ffb140
    '--color-warning-600': '230 159 58', // #e69f3a
    '--color-warning-700': '191 133 48', // #bf8530
    '--color-warning-800': '153 106 38', // #996a26
    '--color-warning-900': '125 87 31', // #7d571f
    // error | #ba274a
    '--color-error-50': '245 223 228', // #f5dfe4
    '--color-error-100': '241 212 219', // #f1d4db
    '--color-error-200': '238 201 210', // #eec9d2
    '--color-error-300': '227 169 183', // #e3a9b7
    '--color-error-400': '207 104 128', // #cf6880
    '--color-error-500': '186 39 74', // #ba274a
    '--color-error-600': '167 35 67', // #a72343
    '--color-error-700': '140 29 56', // #8c1d38
    '--color-error-800': '112 23 44', // #70172c
    '--color-error-900': '91 19 36', // #5b1324
    // surface | #616265
    '--color-surface-50': '231 231 232', // #e7e7e8
    '--color-surface-100': '223 224 224', // #dfe0e0
    '--color-surface-200': '216 216 217', // #d8d8d9
    '--color-surface-300': '192 192 193', // #c0c0c1
    '--color-surface-400': '144 145 147', // #909193
    '--color-surface-500': '97 98 101', // #616265
    '--color-surface-600': '87 88 91', // #57585b
    '--color-surface-700': '73 74 76', // #494a4c
    '--color-surface-800': '58 59 61', // #3a3b3d
    '--color-surface-900': '48 48 49', // #303031
  },
};

export const bdcTheme: CustomThemeConfig = {
  name: 'bdc-theme',
  properties: {
    // =~= Theme Properties =~=
    '--theme-font-family-base': `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
    '--theme-font-family-heading': `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
    '--theme-font-color-base': '0 0 0',
    '--theme-font-color-dark': '255 255 255',
    '--theme-rounded-base': '9999px',
    '--theme-rounded-container': '16px',
    '--theme-border-base': '1px',
    // =~= Theme On-X Colors =~=
    '--on-primary': '255 255 255',
    '--on-secondary': '0 0 0',
    '--on-tertiary': '255 255 255',
    '--on-success': '0 0 0',
    '--on-warning': '0 0 0',
    '--on-error': '255 255 255',
    '--on-surface': '0 0 0',
    // =~= Theme Colors  =~=
    // primary | #1a568c
    '--color-primary-50': '221 230 238', // #dde6ee
    '--color-primary-100': '209 221 232', // #d1dde8
    '--color-primary-200': '198 213 226', // #c6d5e2
    '--color-primary-300': '163 187 209', // #a3bbd1
    '--color-primary-400': '95 137 175', // #5f89af
    '--color-primary-500': '26 86 140', // #1a568c
    '--color-primary-600': '23 77 126', // #174d7e
    '--color-primary-700': '20 65 105', // #144169
    '--color-primary-800': '16 52 84', // #103454
    '--color-primary-900': '13 42 69', // #0d2a45
    // secondary | #41abf5
    '--color-secondary-50': '227 242 254', // #e3f2fe
    '--color-secondary-100': '217 238 253', // #d9eefd
    '--color-secondary-200': '208 234 253', // #d0eafd
    '--color-secondary-300': '179 221 251', // #b3ddfb
    '--color-secondary-400': '122 196 248', // #7ac4f8
    '--color-secondary-500': '65 171 245', // #41abf5
    '--color-secondary-600': '59 154 221', // #3b9add
    '--color-secondary-700': '49 128 184', // #3180b8
    '--color-secondary-800': '39 103 147', // #276793
    '--color-secondary-900': '32 84 120', // #205478
    // tertiary | #616265
    '--color-tertiary-50': '231 231 232', // #e7e7e8
    '--color-tertiary-100': '223 224 224', // #dfe0e0
    '--color-tertiary-200': '216 216 217', // #d8d8d9
    '--color-tertiary-300': '192 192 193', // #c0c0c1
    '--color-tertiary-400': '144 145 147', // #909193
    '--color-tertiary-500': '97 98 101', // #616265
    '--color-tertiary-600': '87 88 91', // #57585b
    '--color-tertiary-700': '73 74 76', // #494a4c
    '--color-tertiary-800': '58 59 61', // #3a3b3d
    '--color-tertiary-900': '48 48 49', // #303031
    // success | #7cae7a
    '--color-success-50': '235 243 235', // #ebf3eb
    '--color-success-100': '229 239 228', // #e5efe4
    '--color-success-200': '222 235 222', // #deebde
    '--color-success-300': '203 223 202', // #cbdfca
    '--color-success-400': '163 198 162', // #a3c6a2
    '--color-success-500': '124 174 122', // #7cae7a
    '--color-success-600': '112 157 110', // #709d6e
    '--color-success-700': '93 131 92', // #5d835c
    '--color-success-800': '74 104 73', // #4a6849
    '--color-success-900': '61 85 60', // #3d553c
    // warning | #FFd046
    '--color-warning-50': '255 248 227', // #fff8e3
    '--color-warning-100': '255 246 218', // #fff6da
    '--color-warning-200': '255 243 209', // #fff3d1
    '--color-warning-300': '255 236 181', // #ffecb5
    '--color-warning-400': '255 222 126', // #ffde7e
    '--color-warning-500': '255 208 70', // #FFd046
    '--color-warning-600': '230 187 63', // #e6bb3f
    '--color-warning-700': '191 156 53', // #bf9c35
    '--color-warning-800': '153 125 42', // #997d2a
    '--color-warning-900': '125 102 34', // #7d6622
    // error | #c0143c
    '--color-error-50': '246 220 226', // #f6dce2
    '--color-error-100': '242 208 216', // #f2d0d8
    '--color-error-200': '239 196 206', // #efc4ce
    '--color-error-300': '230 161 177', // #e6a1b1
    '--color-error-400': '211 91 119', // #d35b77
    '--color-error-500': '192 20 60', // #c0143c
    '--color-error-600': '173 18 54', // #ad1236
    '--color-error-700': '144 15 45', // #900f2d
    '--color-error-800': '115 12 36', // #730c24
    '--color-error-900': '94 10 29', // #5e0a1d
    // surface | #c7c7c8
    '--color-surface-50': '247 247 247', // #f7f7f7
    '--color-surface-100': '244 244 244', // #f4f4f4
    '--color-surface-200': '241 241 241', // #f1f1f1
    '--color-surface-300': '233 233 233', // #e9e9e9
    '--color-surface-400': '216 216 217', // #d8d8d9
    '--color-surface-500': '199 199 200', // #c7c7c8
    '--color-surface-600': '179 179 180', // #b3b3b4
    '--color-surface-700': '149 149 150', // #959596
    '--color-surface-800': '119 119 120', // #777778
    '--color-surface-900': '98 98 98', // #626262
  },
};

export const gicTheme: CustomThemeConfig = {
  name: 'gic-theme',
  properties: {
    // =~= Theme Properties =~=
    '--theme-font-family-base': `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
    '--theme-font-family-heading': `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
    '--theme-font-color-base': '0 0 0',
    '--theme-font-color-dark': '255 255 255',
    '--theme-rounded-base': '9999px',
    '--theme-rounded-container': '16px',
    '--theme-border-base': '2px',
    // =~= Theme On-X Colors =~=
    '--on-primary': '255 255 255',
    '--on-secondary': '255 255 255',
    '--on-tertiary': '0 0 0',
    '--on-success': '0 0 0',
    '--on-warning': '0 0 0',
    '--on-error': '0 0 0',
    '--on-surface': '0 0 0',
    // =~= Theme Colors  =~=
    // primary | #328FFF
    '--color-primary-50': '224 238 255', // #e0eeff
    '--color-primary-100': '214 233 255', // #d6e9ff
    '--color-primary-200': '204 227 255', // #cce3ff
    '--color-primary-300': '173 210 255', // #add2ff
    '--color-primary-400': '112 177 255', // #70b1ff
    '--color-primary-500': '50 143 255', // #328FFF
    '--color-primary-600': '45 129 230', // #2d81e6
    '--color-primary-700': '38 107 191', // #266bbf
    '--color-primary-800': '30 86 153', // #1e5699
    '--color-primary-900': '25 70 125', // #19467d
    // secondary | #675AFF
    '--color-secondary-50': '232 230 255', // #e8e6ff
    '--color-secondary-100': '225 222 255', // #e1deff
    '--color-secondary-200': '217 214 255', // #d9d6ff
    '--color-secondary-300': '194 189 255', // #c2bdff
    '--color-secondary-400': '149 140 255', // #958cff
    '--color-secondary-500': '103 90 255', // #675AFF
    '--color-secondary-600': '93 81 230', // #5d51e6
    '--color-secondary-700': '77 68 191', // #4d44bf
    '--color-secondary-800': '62 54 153', // #3e3699
    '--color-secondary-900': '50 44 125', // #322c7d
    // tertiary | #FFBC35
    '--color-tertiary-50': '255 245 225', // #fff5e1
    '--color-tertiary-100': '255 242 215', // #fff2d7
    '--color-tertiary-200': '255 238 205', // #ffeecd
    '--color-tertiary-300': '255 228 174', // #ffe4ae
    '--color-tertiary-400': '255 208 114', // #ffd072
    '--color-tertiary-500': '255 188 53', // #FFBC35
    '--color-tertiary-600': '230 169 48', // #e6a930
    '--color-tertiary-700': '191 141 40', // #bf8d28
    '--color-tertiary-800': '153 113 32', // #997120
    '--color-tertiary-900': '125 92 26', // #7d5c1a
    // success | #74C449
    '--color-success-50': '234 246 228', // #eaf6e4
    '--color-success-100': '227 243 219', // #e3f3db
    '--color-success-200': '220 240 210', // #dcf0d2
    '--color-success-300': '199 231 182', // #c7e7b6
    '--color-success-400': '158 214 128', // #9ed680
    '--color-success-500': '116 196 73', // #74C449
    '--color-success-600': '104 176 66', // #68b042
    '--color-success-700': '87 147 55', // #579337
    '--color-success-800': '70 118 44', // #46762c
    '--color-success-900': '57 96 36', // #396024
    // warning | #FFFF5A
    '--color-warning-50': '255 255 230', // #ffffe6
    '--color-warning-100': '255 255 222', // #ffffde
    '--color-warning-200': '255 255 214', // #ffffd6
    '--color-warning-300': '255 255 189', // #ffffbd
    '--color-warning-400': '255 255 140', // #ffff8c
    '--color-warning-500': '255 255 90', // #FFFF5A
    '--color-warning-600': '230 230 81', // #e6e651
    '--color-warning-700': '191 191 68', // #bfbf44
    '--color-warning-800': '153 153 54', // #999936
    '--color-warning-900': '125 125 44', // #7d7d2c
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
    // surface | #EBEBEB
    '--color-surface-50': '252 252 252', // #fcfcfc
    '--color-surface-100': '251 251 251', // #fbfbfb
    '--color-surface-200': '250 250 250', // #fafafa
    '--color-surface-300': '247 247 247', // #f7f7f7
    '--color-surface-400': '241 241 241', // #f1f1f1
    '--color-surface-500': '235 235 235', // #EBEBEB
    '--color-surface-600': '212 212 212', // #d4d4d4
    '--color-surface-700': '176 176 176', // #b0b0b0
    '--color-surface-800': '141 141 141', // #8d8d8d
    '--color-surface-900': '115 115 115', // #737373
  },
};
