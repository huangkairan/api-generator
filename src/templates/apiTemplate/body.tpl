/**
 * {Description}
 */
export function {InterfaceName}(
  {UrlParams}{Query}{Body}configs?: RequestConfig,
  isMock?:boolean ): RequestPromise<{Response}> {
  return defs.{Mapping}.{Method}(`${isMock && MockUrl ? MockUrl : ''}{Url}`, {BodyParam} {
    ...configs,
    {QueryParam}
  });
}