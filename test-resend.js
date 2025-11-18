/**
 * Quick test script to verify Resend is configured correctly
 * Run with: node test-resend.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not found in .env.local')
    console.log('\nMake sure you have added:')
    console.log('RESEND_API_KEY=re_your_key_here')
    console.log('\nto your .env.local file')
    process.exit(1)
  }

  console.log('✅ RESEND_API_KEY found')
  console.log('📧 Testing Resend connection...\n')

  try {
    // Dynamic import of Resend
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    // Send a test email
    const data = await resend.emails.send({
      from: 'Sentra Test <onboarding@resend.dev>',
      to: 'delivered@resend.dev', // Resend test address
      subject: 'Resend Configuration Test',
      html: '<h1>Success!</h1><p>Your Resend integration is working correctly.</p>',
    })

    console.log('✅ Test email sent successfully!')
    console.log('📬 Email ID:', data.id)
    console.log('\n🎉 Resend is configured correctly!\n')
    console.log('Next steps:')
    console.log('1. Create a campaign in your app')
    console.log('2. Upload a CSV with recipients')
    console.log('3. Send a test email to yourself')
    console.log('4. Launch your first campaign!\n')
  } catch (error) {
    console.error('❌ Error testing Resend:', error.message)

    if (error.message.includes('Invalid')) {
      console.log('\n💡 Your API key might be invalid. Double-check it at:')
      console.log('   https://resend.com/api-keys\n')
    }
  }
}

testResend()
