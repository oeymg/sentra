export type ResponseTemplate = {
  id: string
  name: string
  tone: 'Professional' | 'Friendly' | 'Apologetic'
  body: string
  keywords: string[]
}

export const responseTemplates: ResponseTemplate[] = [
  {
    id: 'template-thanks-pro',
    name: 'Grateful & Professional',
    tone: 'Professional',
    body: `Hi {{customer}}, thank you for sharing your experience with us. We're thrilled that you're happy with your new home and that our team delivered the level of service you expected. I'll be sure to pass this along to everyone involved—it truly makes their day.`,
    keywords: ['gratitude', 'share-internally', 'positive'],
  },
  {
    id: 'template-friendly-win',
    name: 'Friendly Congrats',
    tone: 'Friendly',
    body: `Thanks so much for the amazing review, {{customer}}! We're so excited that you've settled into your new home. Congratulations on this milestone! If there's ever anything else we can help with, we're only a message away.`,
    keywords: ['enthusiastic', 'positive', 'follow-up'],
  },
  {
    id: 'template-apology',
    name: 'Empathetic Apology',
    tone: 'Apologetic',
    body: `Hi {{customer}}, I'm sorry we didn't meet your expectations this time. I appreciate you bringing this to our attention so we can make it right. I've looped in our team to address this personally and will follow up with you once it's resolved.`,
    keywords: ['apology', 'resolution', 'follow-up'],
  },
]
