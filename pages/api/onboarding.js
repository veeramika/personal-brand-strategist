import getAdminClient from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')
  const payload = req.body || {}
  const admin = getAdminClient()

  try {
    // use demo user if none provided
    let userId = payload.userId
    if (!userId) {
      const { data: u } = await admin.from('users').select('id').eq('email', 'demo@example.com').limit(1).single()
      if (u && u.id) userId = u.id
      else {
        const { data: newUser } = await admin.from('users').insert({ email: 'demo@example.com' }).select().single()
        userId = newUser.id
      }
    }

    // upsert profile
    const profileValues = {
      user_id: userId,
      full_name: payload.fullName || payload.full_name || null,
      profession: payload.profession || null,
      industry: payload.industry || null,
      years_experience: payload.years_experience || payload.yearsExperience || null
    }

    const { data: profile } = await admin.from('profiles').upsert(profileValues, { onConflict: ['user_id'], returning: 'representation' }).select().single()

    const profileId = profile.id

    // business model
    if (payload.businessModel) {
      await admin.from('business_models').upsert({ profile_id: profileId, business_type: payload.businessModel.business_type || payload.businessModel.businessType || null, target_audience: payload.businessModel.target_audience || payload.businessModel.targetAudience || null, offers: payload.businessModel.offers || null })
    }

    // niche positioning (partial)
    if (payload.brandVision) {
      await admin.from('niche_positioning').upsert({ profile_id: profileId, primary_goal: payload.brandVision.primary_goal || null, why_build: payload.brandVision.why || null, known_for: payload.brandVision.known_for || null })
    }

    // platforms
    if (payload.platforms) {
      await admin.from('user_platforms').upsert({ profile_id: profileId, platforms: payload.platforms.platforms || payload.platforms, posting_frequency: payload.platforms.posting_frequency || payload.platforms.postingFrequency || null, time_per_week: payload.platforms.time_per_week || payload.platforms.timePerWeek || null })
    }

    // content preferences
    if (payload.contentPreferences) {
      await admin.from('content_preferences').upsert({ profile_id: profileId, content_formats: payload.contentPreferences.content_formats || payload.contentPreferences.formats || null, camera_comfort_level: payload.contentPreferences.camera_comfort_level || payload.contentPreferences.cameraComfort || null, content_strengths: payload.contentPreferences.content_strengths || payload.contentPreferences.strengths || null, editing_skill_level: payload.contentPreferences.editing_skill_level || payload.contentPreferences.editingSkill || null })
    }

    // posting plan (basic)
    if (payload.postingPlan) {
      await admin.from('posting_plan').upsert({ profile_id: profileId, recommended_frequency: payload.postingPlan.recommended_frequency || payload.postingPlan.frequency || null, weekly_schedule: payload.postingPlan.weekly_schedule || null })
    }

    return res.status(200).json({ profileId, message: 'Onboarding saved' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || String(err) })
  }
}
