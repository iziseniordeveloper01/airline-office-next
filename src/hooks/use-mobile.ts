import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Lazy initializer reads the real value on first render instead of a
  // setState call inside the effect body (React Compiler's stricter
  // react-hooks/set-state-in-effect rule forbids the latter).
  const [isMobile, setIsMobile] = React.useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
