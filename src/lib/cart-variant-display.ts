import { formatCorporateEventSizeOption } from '@/lib/corporate-event-cupcakes'

export function formatCartSizeOption(option: string): string {
  if (option.startsWith('Mini Box of')) {
    return formatCorporateEventSizeOption(option)
  }
  return option
}

export function formatCartLineVariant(name: string, option: string): string {
  if (name.toLowerCase() === 'size') {
    return `${name}: ${formatCartSizeOption(option)}`
  }
  return `${name}: ${option}`
}
