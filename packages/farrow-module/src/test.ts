import { createProvider, Module, Container } from './'

export const coinBasePath = createProvider<string>()

export type CoinPaths = {
  coin: string
  coinPayment: string
  coinPaymentCode: string
}

export const coinPathFragementsProvider = createProvider<CoinPaths>()

class CoinPath extends Module {
  private base = this.use(coinBasePath)

  private fragements = this.use(coinPathFragementsProvider)

  get paths(): CoinPaths {
    const paths: Record<string, string> = {}
    getKeys(this.fragements).forEach((key) => {
      paths[key] = `${this.base}${this.fragements[key]}`
    })
    return paths as CoinPaths
  }

  // coin = this.base
  // coinPayment = `${this.base}/cashier`
  // coinPaymentCode = `${this.base}/payment-code`
}

class CoinBaseContainer extends Container {
  base = this.inject(coinBasePath.provide('/coin'))

  coinPath = this.use(CoinPath)
}

class RechargeBaseContainer extends Container {
  base = this.inject(coinBasePath.provide('/recharge'))

  coinPath = this.new(CoinPath)
}

export class Paths extends Container {
  fragements = this.inject(
    coinPathFragementsProvider.provide({
      coin: '',
      coinPayment: '/cashier',
      coinPaymentCode: '/payment-code',
    }),
  )

  coin = this.new(CoinBaseContainer)
  recharge = this.new(RechargeBaseContainer)

  get list() {
    return {
      coin: [this.coin.coinPath.paths.coin, this.recharge.coinPath.paths.coin],
      coinPayment: [this.coin.coinPath.paths.coinPayment, this.recharge.coinPath.paths.coinPayment],
      coinPaymentCode: [this.coin.coinPath.paths.coinPaymentCode, this.recharge.coinPath.paths.coinPaymentCode],
    }
  }
}

export const paths = new Paths()

export const getKeys = <T extends {}>(o: T) => Object.keys(o) as (keyof T)[]
