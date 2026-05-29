import { StarIcon } from '@heroicons/react/24/solid'

interface StarRatingProps {
  rating: number
  reviews: number
}

export default function StarRating({ rating, reviews }: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex items-center justify-center gap-1">
      {/* Full stars */}
      {Array.from({ length: fullStars }, (_, i) => (
        <StarIcon key={`full-${i}`} className="h-4 w-4 text-yellow-400" />
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <StarIcon className="h-4 w-4 text-gray-300" />
          <StarIcon
            className="absolute inset-0 h-4 w-4 overflow-hidden text-yellow-400"
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          />
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }, (_, i) => (
        <StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      ))}
    </div>
  )
}
