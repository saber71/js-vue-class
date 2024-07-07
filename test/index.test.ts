import { LoadableContainer } from "@heraclius/injectify"
import { describe, expect, test } from "vitest"
import { isRef } from "vue"
import { Computed, Debounce, Mut, Readonly, Service, Throttle, VueComponent, Watcher } from "../src"

VueComponent.__test__ = true

describe("vue-class", () => {
  test("Mut Readonly Computed Watcher", () => {
    @Service()
    class A {
      @Mut()
      a = 0

      c = 0

      @Readonly()
      obj = { a: 12 }

      watchWorked = false

      @Computed()
      get b() {
        this.c++
        return this.c
      }

      @Watcher({ source: "a" })
      watch() {
        this.watchWorked = true
      }
    }

    const container = new LoadableContainer()
    container.loadFromClass([A])
    const a = container.getValue(A)
    a.a++
    a.obj.a = 0

    expect(a.b).toEqual(2)
    expect(a.c === a.b).toEqual(true)
    expect(a.obj.a).toEqual(12)
    expect(isRef((a as any)[Symbol.for("a")])).toEqual(true)
    setTimeout(() => expect(a.watchWorked).toEqual(true), 10)
  })

  test("Throttle Debounce", () => {
    @Service()
    class Class2 {
      throttleWorked = false
      debounceWorked = false

      @Throttle()
      throttleFn() {
        this.throttleWorked = true
      }

      @Debounce()
      debounceFn() {
        this.debounceWorked = true
      }
    }
    const container = new LoadableContainer()
    container.loadFromClass([Class2])
    const a = container.getValue(Class2)
    a.throttleFn()
    a.debounceFn()

    expect(a.throttleWorked).toEqual(false)
    expect(a.debounceWorked).toEqual(false)

    setTimeout(() => {
      expect(a.throttleWorked).toEqual(true)
      expect(a.debounceWorked).toEqual(true)
    }, 400)
  })
})
