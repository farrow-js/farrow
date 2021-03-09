import React from 'react'
import { page, Controller } from 'farrow-next'

const View = () => {
  let redirectCtrl = RedirectCtrl.use()

  React.useEffect(() => {
    redirectCtrl.redirect(`${redirectCtrl.page.query.back ?? '/'}`)
  }, [])

  return null
}

class RedirectCtrl extends Controller {
  preload() {
    if (this.page.query.server) {
      this.redirect(`${this.page.query.back ?? '/'}`)
    }
  }
}

export default page({
  View,
  Controllers: {
    RedirectCtrl,
  },
})
