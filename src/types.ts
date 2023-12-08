export type ColorFunc = (str: string | number) => string

export interface Template {
  name: string
  detail: string
  color: ColorFunc
}
