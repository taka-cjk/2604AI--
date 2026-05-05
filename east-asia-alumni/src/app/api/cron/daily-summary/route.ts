import { createClient } from "@supabase/supabase-js"
import nodemailer from "nodemailer"
import { NextResponse } from "next/server"

type NotifRow = {
  user_id: string
  actor_id: string | null
  type: string
  entity_id: string | null
  actor: { full_name: string } | null
}

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [{ data: rawNotifs }, { data: newEvents }] = await Promise.all([
    supabase
      .from("notifications")
      .select("user_id, actor_id, type, entity_id, actor:profiles!notifications_actor_id_fkey(full_name)")
      .eq("read", false)
      .gte("created_at", since),
    supabase
      .from("events")
      .select("id, title")
      .gte("created_at", since),
  ])

  if (!rawNotifs?.length && !newEvents?.length) {
    return NextResponse.json({ sent: 0 })
  }

  const notifs = (rawNotifs ?? []) as NotifRow[]

  // コメント・メンション通知の投稿プレビューを取得
  const postIds = [...new Set(
    notifs
      .filter(n => ["comment", "mention"].includes(n.type) && n.entity_id)
      .map(n => n.entity_id as string)
  )]
  const postPreviews: Record<string, string> = {}
  if (postIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, content")
      .in("id", postIds)
    for (const post of posts ?? []) {
      postPreviews[post.id] = post.content.length > 60
        ? post.content.slice(0, 60) + "..."
        : post.content
    }
  }

  // ユーザーごとにグループ化
  const userMap = new Map<string, NotifRow[]>()
  for (const n of notifs) {
    if (!userMap.has(n.user_id)) userMap.set(n.user_id, [])
    userMap.get(n.user_id)!.push(n)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://east-asia-alumni.vercel.app"
  let sent = 0

  for (const [userId, userNotifs] of userMap) {
    // email_opt_out チェック
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email_opt_out")
      .eq("id", userId)
      .single()
    if (profile?.email_opt_out) continue

    const { data: authData } = await supabase.auth.admin.getUserById(userId)
    const email = authData.user?.email
    if (!email) continue

    const firstName = profile?.full_name?.split(" ")[0] ?? "there"
    const events = newEvents ?? []
    const totalCount = userNotifs.length + events.length

    await getTransporter().sendMail({
      from: `"East Asia Alumni" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `You have ${totalCount} new update${totalCount !== 1 ? "s" : ""} – East Asia Alumni`,
      html: buildEmail(firstName, userNotifs, postPreviews, events, appUrl),
    })
    sent++
  }

  return NextResponse.json({ sent })
}

function buildEmail(
  firstName: string,
  notifs: NotifRow[],
  postPreviews: Record<string, string>,
  newEvents: { id: string; title: string }[],
  appUrl: string
): string {
  const groups: Record<string, NotifRow[]> = {}
  for (const n of notifs) {
    if (!groups[n.type]) groups[n.type] = []
    groups[n.type].push(n)
  }

  const btn = `<a href="${appUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:600;font-size:14px">Open App →</a>`

  let sections = ""

  if (groups.follow?.length) {
    const items = groups.follow
      .map(n => `<li style="margin:4px 0;color:#334155">· ${n.actor?.full_name ?? "Someone"} started following you</li>`)
      .join("")
    sections += section("👤", `New Followers (${groups.follow.length})`, `<ul style="margin:6px 0;padding:0;list-style:none">${items}</ul>`)
  }

  if (groups.comment?.length) {
    const items = groups.comment.map(n => {
      const preview = n.entity_id && postPreviews[n.entity_id]
        ? `<br><span style="color:#64748b;font-size:12px">"${postPreviews[n.entity_id]}"</span>`
        : ""
      return `<li style="margin:4px 0;color:#334155">· ${n.actor?.full_name ?? "Someone"} commented on your post${preview}</li>`
    }).join("")
    sections += section("💬", `Comments (${groups.comment.length})`, `<ul style="margin:6px 0;padding:0;list-style:none">${items}</ul>`)
  }

  const msgCount = groups.message?.length ?? 0
  if (msgCount > 0) {
    sections += section("📩", `Messages (${msgCount})`, `<p style="margin:6px 0;color:#475569">You have ${msgCount} unread message${msgCount !== 1 ? "s" : ""}</p>`)
  }

  if (newEvents.length > 0) {
    const items = newEvents.map(e => `<li style="margin:4px 0;color:#334155">· "${e.title}" was added</li>`).join("")
    sections += section("🎉", `New Events (${newEvents.length})`, `<ul style="margin:6px 0;padding:0;list-style:none">${items}</ul>`)
  }

  const likeCount = groups.like?.length ?? 0
  if (likeCount > 0) {
    sections += section("❤️", `Likes (${likeCount})`, `<p style="margin:6px 0;color:#475569">Your post received ${likeCount} new like${likeCount !== 1 ? "s" : ""}</p>`)
  }

  if (groups.mention?.length) {
    const items = groups.mention.map(n => {
      const preview = n.entity_id && postPreviews[n.entity_id]
        ? `<br><span style="color:#64748b;font-size:12px">"${postPreviews[n.entity_id]}"</span>`
        : ""
      return `<li style="margin:4px 0;color:#334155">· ${n.actor?.full_name ?? "Someone"} mentioned you${preview}</li>`
    }).join("")
    sections += section("@", `Mentions (${groups.mention.length})`, `<ul style="margin:6px 0;padding:0;list-style:none">${items}</ul>`)
  }

  if (groups.event_join?.length) {
    const items = groups.event_join
      .map(n => `<li style="margin:4px 0;color:#334155">· ${n.actor?.full_name ?? "Someone"} joined your event</li>`)
      .join("")
    sections += section("🎟️", `Event Joins (${groups.event_join.length})`, `<ul style="margin:6px 0;padding:0;list-style:none">${items}</ul>`)
  }

  if (groups.thread_reply?.length) {
    const count = groups.thread_reply.length
    sections += section("↩️", `Thread Replies (${count})`, `<p style="margin:6px 0;color:#475569">You have ${count} new thread repl${count !== 1 ? "ies" : "y"}</p>`)
  }

  if (groups.event_update?.length) {
    const count = groups.event_update.length
    sections += section("📅", `Event Updates (${count})`, `<p style="margin:6px 0;color:#475569">${count} event${count !== 1 ? "s" : ""} you joined ha${count !== 1 ? "ve" : "s"} been updated</p>`)
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
        <tr><td style="background:#4f46e5;padding:20px 32px">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700">East Asia Alumni Network</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 4px;font-size:16px;color:#1e293b;font-weight:600">Hi ${firstName},</p>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b">Here's what happened while you were away — don't miss out!</p>
          <div style="margin-bottom:28px">${btn}</div>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          ${sections}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <div style="text-align:center">${btn}</div>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f8fafc;text-align:center">
          <p style="margin:0;font-size:12px;color:#94a3b8">East Asia Alumni Network · <a href="${appUrl}" style="color:#94a3b8;text-decoration:none">Visit site</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function section(emoji: string, title: string, content: string): string {
  return `<div style="margin-bottom:20px">
  <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1e293b">${emoji} ${title}</p>
  <div style="font-size:13px">${content}</div>
</div>`
}
