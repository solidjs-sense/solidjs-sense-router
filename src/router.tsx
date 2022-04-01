import { createSignal, JSX } from "solid-js";
import { RouteContext } from "./hook";
import { api } from "./api";

export const Router = (props: { url?: string, children: JSX.Element}) => {
  console.assert(
    api.isClient || (!api.isClient && !!props.url),
    'Router must be initialized with a url in server mode'
  )

  const [pending, setPending] = createSignal(false)
  const [base, setBase] = createSignal('')
  const [url, setUrl] = createSignal<URL>(new URL(api.isClient && api.href ? api.href : props.url!))
  const [state, setState] = createSignal<any>()

  return (
    <RouteContext.Provider
      value={{
        pending,
        setPending,
        base,
        setBase,
        url,
        setUrl,
        state,
        setState
      }}
    >
      {props.children}
    </RouteContext.Provider>
  )
}
