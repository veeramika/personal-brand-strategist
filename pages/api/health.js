export default function handler(req, res) {
  const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  res.status(200).json({
    supabase: {
      urlPresent: hasUrl,
      anonKeyPresent: hasAnon,
      serviceRolePresent: hasService
    }
  })
}
