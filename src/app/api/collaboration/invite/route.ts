import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { githubUsername } = await req.json();

    if (!githubUsername) {
      return NextResponse.json({ success: false, error: "GitHub username is required" }, { status: 400 });
    }

    // Fetch the user from GitHub API
    const ghRes = await fetch(`https://api.github.com/users/${githubUsername}`);
    if (!ghRes.ok) {
      if (ghRes.status === 404) {
        return NextResponse.json({ success: false, error: "GitHub user not found" }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: "Error communicating with GitHub" }, { status: 500 });
    }

    const ghData = await ghRes.json();
    
    // Create a mock TeamMember object based on their GitHub profile
    const name = ghData.name || ghData.login;
    const parts = name.split(" ");
    const initials = (parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");

    const newMember = {
      id: ghData.login,
      name: name,
      role: ghData.company || "External Collaborator",
      color: "#3b82f6", // Default blue for invited members
      status: "offline",
      viewing: "",
      typing: false,
    };

    return NextResponse.json({ success: true, data: newMember });
  } catch (err) {
    console.error("[collab/invite] error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
