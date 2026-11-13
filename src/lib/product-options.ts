type ProductOption = { name?: string; values?: string[] }
type ProductVariantOptions = {
  option1Value?: string
  option2Value?: string
  option3Value?: string
}

/** Keep option value lists in step with the variants that can actually be bought. */
export function syncProductOptionValues(
  options: ProductOption[] | null | undefined,
  variants: ProductVariantOptions[] | null | undefined
): ProductOption[] {
  const next = (options || []).map((option) => ({
    name: option.name,
    values: [...(option.values || [])],
  }))

  const ensure = (index: number, name: string) => {
    if (!next[index]) next[index] = { name, values: [] }
    if (!next[index].values) next[index].values = []
    return next[index]
  }

  const add = (option: ProductOption, value: string) => {
    const trimmed = value.trim()
    if (!trimmed || option.values?.includes(trimmed)) return
    option.values?.push(trimmed)
  }

  for (const variant of variants || []) {
    if (variant.option1Value) add(ensure(0, 'Size'), variant.option1Value)
    if (variant.option2Value) add(ensure(1, 'Flavour'), variant.option2Value)
    if (variant.option3Value) add(ensure(2, 'Option 3'), variant.option3Value)
  }

  return next
}
