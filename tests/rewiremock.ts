import rewiremock from 'rewiremock'

/* eslint-disable camelcase */
import * as effector_22_0_0 from 'effector-22-0-0'
import * as effector_22_8_3 from 'effector-22-8-3'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const effectorVersion: string = process.env.EFFECTOR_VERSION || '22.0.0'

rewiremock('effector').with(
  {
    '22.0.0': effector_22_0_0,
    '22.8.3': effector_22_8_3,
  }[effectorVersion]
)

rewiremock.enable()
export { rewiremock }
