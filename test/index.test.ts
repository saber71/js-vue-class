import { describe, expect, test } from "vitest"
import { isRef } from "vue"
import { LoadableContainer } from "@heraclius/injectify"
import { ModuleName } from "../src/constants"
import { Computed, Mut, Readonly, Service, Watcher } from "../src/decorators"
import { VueComponent } from "../src/vue-component"

VueComponent.__test__ = true

@Service()
class A {
  @Mut()
  a = 0

  c = 0

  @Readonly()
  obj = { a: 12 }

  @Computed()
  get b() {
    this.c++
    return this.c
  }

  @Watcher({ source: "a" })
  watch() {
    expect(this.a).toEqual(1)
  }
}

describe("vue-class", () => {
  test("Service", () => {
    const container = new LoadableContainer()
    container.load({ moduleName: ModuleName })
    const a = container.getValue(A)
    a.a++
    a.obj.a = 0

    expect(a.b).toEqual(2)
    expect(a.c === a.b).toEqual(true)
    expect(a.obj.a).toEqual(12)
    expect(isRef((a as any)[Symbol.for("a")])).toEqual(true)
  })
})
