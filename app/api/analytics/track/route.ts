import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      event_type,
      event_category,
      user_id,
      session_id,
      page_url,
      component_location,
      metadata = {}
    } = body

    // Validation
    if (!event_type) {
      return NextResponse.json(
        { error: 'event_type is required' },
        { status: 400 }
      )
    }

    // Extract page path from URL
    let page_path = null
    try {
      if (page_url) {
        const url = new URL(page_url)
        page_path = url.pathname
      }
    } catch (e) {
      // Invalid URL, skip
    }

    // Get user agent and IP
    const user_agent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null

    // Get IP address (handle various proxy headers)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip_address = forwarded ? forwarded.split(',')[0].trim() :
                       request.headers.get('x-real-ip') ||
                       null

    // Insert event into database
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_type,
        event_category,
        user_id,
        session_id,
        page_url,
        page_path,
        component_location,
        user_agent,
        ip_address,
        referrer,
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('[Analytics API] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to track event', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[Analytics] ✅ Tracked: ${event_type} | User: ${user_id || 'anonymous'} | Location: ${component_location || 'unknown'}`)

    return NextResponse.json({
      success: true,
      event: data
    })

  } catch (error: any) {
    console.error('[Analytics API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
