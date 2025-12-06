import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Query analytics events with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Filters
    const event_type = searchParams.get('event_type')
    const user_id = searchParams.get('user_id')
    const session_id = searchParams.get('session_id')
    const page_path = searchParams.get('page_path')
    const component_location = searchParams.get('component_location')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Grouping
    const group_by = searchParams.get('group_by') // 'event_type', 'user_id', 'page_path', 'date'

    // Build query
    let query = supabase.from('analytics_events').select('*', { count: 'exact' })

    // Apply filters
    if (event_type) query = query.eq('event_type', event_type)
    if (user_id) query = query.eq('user_id', user_id)
    if (session_id) query = query.eq('session_id', session_id)
    if (page_path) query = query.eq('page_path', page_path)
    if (component_location) query = query.eq('component_location', component_location)
    if (date_from) query = query.gte('created_at', date_from)
    if (date_to) query = query.lte('created_at', date_to)

    // Order by most recent
    query = query.order('created_at', { ascending: false })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[Analytics API] Query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      )
    }

    // If grouping requested, process data
    let result = data || []
    let grouped_data = null

    if (group_by && data) {
      grouped_data = groupEvents(data, group_by)
    }

    return NextResponse.json({
      success: true,
      total: count || 0,
      events: result,
      grouped_data,
      filters: {
        event_type,
        user_id,
        session_id,
        page_path,
        component_location,
        date_from,
        date_to,
        limit,
        offset
      }
    })

  } catch (error: any) {
    console.error('[Analytics API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Batch delete events
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, filters } = body

    if (!ids && !filters) {
      return NextResponse.json(
        { error: 'Either ids or filters must be provided' },
        { status: 400 }
      )
    }

    let query = supabase.from('analytics_events').delete()

    if (ids && Array.isArray(ids)) {
      // Delete by specific IDs
      query = query.in('id', ids)
    } else if (filters) {
      // Delete by filters
      if (filters.event_type) query = query.eq('event_type', filters.event_type)
      if (filters.user_id) query = query.eq('user_id', filters.user_id)
      if (filters.date_before) query = query.lt('created_at', filters.date_before)
    }

    const { data, error } = await query.select()

    if (error) {
      console.error('[Analytics API] Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete events', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[Analytics] 🗑️ Deleted ${data?.length || 0} events`)

    return NextResponse.json({
      success: true,
      deleted_count: data?.length || 0
    })

  } catch (error: any) {
    console.error('[Analytics API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to group events
function groupEvents(events: any[], group_by: string) {
  const grouped: Record<string, any> = {}

  events.forEach(event => {
    let key = ''

    switch (group_by) {
      case 'event_type':
        key = event.event_type || 'unknown'
        break
      case 'user_id':
        key = event.user_id || 'anonymous'
        break
      case 'page_path':
        key = event.page_path || 'unknown'
        break
      case 'date':
        key = new Date(event.created_at).toISOString().split('T')[0]
        break
      case 'component_location':
        key = event.component_location || 'unknown'
        break
      default:
        key = 'all'
    }

    if (!grouped[key]) {
      grouped[key] = {
        key,
        count: 0,
        events: []
      }
    }

    grouped[key].count++
    grouped[key].events.push(event)
  })

  return Object.values(grouped).sort((a, b) => b.count - a.count)
}
