// holds the Lenis instance so other components (cart drawer, menus) can pause scrolling
export const scroll = { lenis: null }
export const lockScroll = () => scroll.lenis?.stop()
export const unlockScroll = () => scroll.lenis?.start()

// true until the opening curtain has played once per browser session
export const intro = { pending: typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('naqsh-intro') }
