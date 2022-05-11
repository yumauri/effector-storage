import rewiremock from 'rewiremock'

/* eslint-disable camelcase */
import * as effector_21_0_0 from 'effector-21-0-0'
import * as effector_21_8_12 from 'effector-21-8-12'
import * as effector_22_0_0 from 'effector-22-0-0'
import * as effector_22_3_0 from 'effector-22-3-0'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const effectorVersion: string = process.env.EFFECTOR_VERSION || '21.0.0'

rewiremock('effector').with(
  {
    '21.0.0': effector_21_0_0,
    '21.8.12': effector_21_8_12,
    '22.0.0': effector_22_0_0,
    '22.3.0': effector_22_3_0,
  }[effectorVersion]
)

rewiremock.enable()
export { rewiremock }
