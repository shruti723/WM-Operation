"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Building2, ChevronLeft, Calendar, MapPin, Clock, FileText } from "lucide-react"

interface Submission {
  date: string
  siteName: string
  supervisorName: string
  siteVisitConducted: boolean
  submittedAt: string
}

export default function SubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    const userData = sessionStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    // Load submissions from localStorage
    const storedSubmissions = JSON.parse(localStorage.getItem("submissions") || "[]")
    // Sort by most recent first
    setSubmissions(storedSubmissions.reverse())
  }, [router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => router.push("/home")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">My Submissions</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Empty className="max-w-sm">
              <EmptyMedia variant="icon">
                <FileText className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No Submissions Yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t submitted any checklists yet. Start your first one to see it here.
              </EmptyDescription>
              <EmptyContent>
                <Button onClick={() => router.push("/checklist")}>
                  Start New Checklist
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
              </p>
            </div>

            {submissions.map((submission, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{submission.siteName || "No Site Selected"}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(submission.date)}
                      </CardDescription>
                    </div>
                    <Badge variant={submission.siteVisitConducted ? "default" : "secondary"}>
                      {submission.siteVisitConducted ? "Site Visited" : "No Visit"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{submission.supervisorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Submitted {formatTime(submission.submittedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* FAB for new checklist */}
      {submissions.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <Button
            size="lg"
            className="h-14 px-6 rounded-full shadow-lg"
            onClick={() => router.push("/checklist")}
          >
            New Checklist
          </Button>
        </div>
      )}
    </div>
  )
}
