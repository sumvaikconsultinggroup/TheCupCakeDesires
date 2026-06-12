import mongoose from 'mongoose'

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    page: {
      type: String,
      required: true,
      default: 'homepage',
      index: true,
    },
    pageRef: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FAQCategory',
      required: false,
      default: undefined,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

if (mongoose.models.FAQ) {
  mongoose.deleteModel('FAQ')
}

export default mongoose.model('FAQ', faqSchema)
