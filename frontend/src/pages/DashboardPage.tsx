import { useAuthStore } from "@/stores/auth-store";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Library,
  FolderOpen,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  MessageSquare,
  Sparkles,
  PlayCircle,
  AlertCircle,
  Award,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { useGlobalAnalytics } from "@/hooks/useAnalytics";
import { formatDistanceToNow } from "date-fns";

export function DashboardPage() {
  const { profile } = useAuthStore();
  const { data: analytics, isLoading } = useGlobalAnalytics();

  const getEventDescription = (event: any) => {
    const data = event.event_data || {};
    switch (event.event_type) {
      case "space_created":
        return `Created space "${data.spaceName || "New Space"}"`;
      case "project_created":
        return `Created project "${data.projectName || "New Project"}"`;
      case "document_upload":
        return `Uploaded document "${data.title || "Document"}"`;
      case "document_processed":
        return `Processed document "${data.title || "Document"}" (${data.totalPages || 0} pages)`;
      case "chat_message":
        return `Chatted with AI Tutor`;
      case "quiz_generated":
        return `Generated a quiz with ${data.questionCount || 0} questions`;
      case "quiz_completed":
        return `Completed a quiz with score ${data.score ?? 0}%`;
      default:
        return event.event_type?.replace(/_/g, " ") || "Learning activity";
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "space_created":
        return <Library className="h-4 w-4 text-blue-600" />;
      case "project_created":
        return <FolderOpen className="h-4 w-4 text-blue-600" />;
      case "document_upload":
      case "document_processed":
        return <FileText className="h-4 w-4 text-emerald-600" />;
      case "chat_message":
        return <MessageSquare className="h-4 w-4 text-sky-600" />;
      case "quiz_generated":
      case "quiz_completed":
        return <CheckCircle2 className="h-4 w-4 text-indigo-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatEventTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  const continueLearning = analytics?.continueLearning;
  const areasRequiringAttention = analytics?.areasRequiringAttention || [];
  const recommendedTopics = analytics?.recommendedTopics || [];
  const aiSuggestedQuestions = analytics?.aiSuggestedQuestions || [];

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Student"}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your study progress, practice weak areas, and continue where you left off.
          </p>
        </div>
        {continueLearning && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs shrink-0 font-medium">
            <Link to={`/projects/${continueLearning.projectId}/tutor`}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Resume Learning
            </Link>
          </Button>
        )}
      </div>

      {/* Continue Learning Hero Section - Clean Modern Gradient with Vibrant Indigo/Blue Accent */}
      {isLoading ? (
        <Skeleton className="h-36 w-full rounded-2xl" />
      ) : continueLearning ? (
        <Card className="border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md rounded-2xl overflow-hidden relative">
          {/* Subtle glass glow effect */}
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-1/4 -bottom-10 w-48 h-48 bg-cyan-400/15 rounded-full blur-xl pointer-events-none" />
          
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-xs">
                    <Sparkles className="mr-1 h-3 w-3 text-amber-300 fill-amber-300" />
                    Active Course
                  </span>
                  <span className="text-xs text-blue-100/80">•</span>
                  <span className="text-xs text-blue-100/90 font-medium">Continue where you left off</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
                  {continueLearning.projectName}
                </h2>
                <div className="flex items-center text-xs sm:text-sm text-blue-100 gap-2">
                  <FileText className="h-4 w-4 text-cyan-200 shrink-0" />
                  <span className="truncate font-medium">{continueLearning.documentTitle}</span>
                  {continueLearning.totalPages > 0 && (
                    <span className="text-blue-200 shrink-0">({continueLearning.totalPages} pages)</span>
                  )}
                </div>
                <div className="pt-2 flex items-center gap-3 max-w-xs">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-blue-100 mb-1.5 font-medium">
                      <span>Overall Mastery</span>
                      <span className="text-white font-bold">{continueLearning.overallMastery}%</span>
                    </div>
                    <Progress value={continueLearning.overallMastery} className="h-2 bg-black/20 [&>div]:bg-white" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
                <Button asChild size="default" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm transition-transform active:scale-95">
                  <Link to={`/projects/${continueLearning.projectId}/tutor`}>
                    <MessageSquare className="mr-2 h-4 w-4 text-blue-600" />
                    Open AI Tutor
                  </Link>
                </Button>
                <Button asChild size="default" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-xs font-medium">
                  <Link to={`/projects/${continueLearning.projectId}/quizzes`}>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-cyan-300" />
                    Practice Quiz
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stats Cards - Colorful Accented Cards with Soft Tint Backgrounds */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Spaces */}
        <Card className="bg-gradient-to-br from-blue-50/70 to-white border-blue-100/80 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700">Total Spaces</CardTitle>
            <div className="p-2 rounded-xl bg-blue-500 text-white shadow-xs">
              <Library className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-950">{analytics?.totalSpaces ?? 0}</div>
                <p className="text-xs text-blue-600/80 font-medium mt-0.5">Study spaces</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Courses */}
        <Card className="bg-gradient-to-br from-indigo-50/70 to-white border-indigo-100/80 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700">Active Courses</CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500 text-white shadow-xs">
              <FolderOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-950">{analytics?.totalProjects ?? 0}</div>
                <p className="text-xs text-indigo-600/80 font-medium mt-0.5">Projects & subjects</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="bg-gradient-to-br from-emerald-50/70 to-white border-emerald-100/80 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700">Documents</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950">{analytics?.totalDocuments ?? 0}</div>
                <p className="text-xs text-emerald-600/80 font-medium mt-0.5">Indexed files</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quiz Mastery */}
        <Card className="bg-gradient-to-br from-violet-50/70 to-white border-violet-100/80 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700">Quiz Mastery</CardTitle>
            <div className="p-2 rounded-xl bg-violet-500 text-white shadow-xs">
              <Award className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-extrabold text-violet-950">
                  {analytics?.overallMastery ? `${analytics.overallMastery}%` : analytics?.totalQuizzes > 0 ? `${analytics.avgScore}%` : "0%"}
                </div>
                <p className="text-xs text-violet-600/80 font-medium mt-0.5">
                  {analytics?.totalQuizzes ?? 0} {analytics?.totalQuizzes === 1 ? 'quiz completed' : 'quizzes completed'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Topics / Courses to Learn */}
      <Card className="bg-white border-slate-200/90 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-blue-100 text-blue-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">
                Recommended Topics to Learn
              </CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm text-slate-500 mt-1">
              Targeted concepts based on your course documents, quiz scores, and retention rate.
            </CardDescription>
          </div>
          {continueLearning && (
            <Button variant="ghost" size="sm" asChild className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold">
              <Link to={`/projects/${continueLearning.projectId}/mastery`}>
                View All Mastery <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : recommendedTopics.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
              <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No topic recommendations yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Upload course PDFs or take an adaptive quiz to get personalized recommendations here.
              </p>
              <div className="mt-4">
                <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  <Link to="/spaces">Go to Spaces</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedTopics.map((topic: any) => {
                const isAttention = topic.status === 'attention';
                const isMastered = topic.status === 'mastered';
                return (
                  <div
                    key={topic.id}
                    className={`flex flex-col justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                      isAttention
                        ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/50 to-white hover:border-amber-300'
                        : isMastered
                        ? 'border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white hover:border-emerald-300'
                        : 'border-blue-200/80 bg-gradient-to-b from-blue-50/40 to-white hover:border-blue-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase truncate">
                          {topic.projectName}
                        </span>
                        {isAttention ? (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] px-2 py-0.5 font-semibold">
                            Needs Attention
                          </Badge>
                        ) : isMastered ? (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] px-2 py-0.5 font-semibold">
                            Mastered
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] px-2 py-0.5 font-semibold">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                        {topic.name}
                      </h4>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                          <span>Mastery</span>
                          <span className={isAttention ? 'text-amber-700 font-bold' : isMastered ? 'text-emerald-700 font-bold' : 'text-blue-700 font-bold'}>
                            {topic.masteryLevel}%
                          </span>
                        </div>
                        <Progress
                          value={topic.masteryLevel}
                          className={`h-2 bg-slate-100 ${
                            isAttention
                              ? '[&>div]:bg-amber-500'
                              : isMastered
                              ? '[&>div]:bg-emerald-500'
                              : '[&>div]:bg-blue-600'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100/80">
                      <Button
                        asChild
                        size="sm"
                        className={`w-full text-xs h-8 font-semibold shadow-2xs ${
                          isAttention
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : isMastered
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <Link to={`/projects/${topic.projectId}/${topic.actionTab || 'tutor'}`}>
                          {topic.actionTab === 'tutor' ? (
                            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {topic.action}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Focus Areas Requiring Attention - Clean Light Amber Card */}
      {areasRequiringAttention.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-50/80 to-orange-50/60 border-amber-200 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-2xs">
                <AlertCircle className="h-4 w-4" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold text-amber-950">
                Focus Areas Requiring Attention
              </CardTitle>
            </div>
            <CardDescription className="text-amber-900/80 text-xs sm:text-sm font-medium">
              Concepts scoring under 70% mastery. Reviewing these will boost your retention and test scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {areasRequiringAttention.map((area: any) => (
                <div
                  key={area.id}
                  className="p-4 rounded-xl border border-amber-200/80 bg-white/95 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">{area.conceptName}</span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                        {area.masteryLevel}% mastery
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {area.recommendation}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button asChild size="sm" variant="ghost" className="text-xs h-7 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold">
                      <Link to={`/projects/${area.projectId}/tutor`}>
                        <MessageSquare className="mr-1 h-3.5 w-3.5 text-blue-500" /> Ask Tutor
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="text-xs h-7 px-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-2xs">
                      <Link to={`/projects/${area.projectId}/quizzes`}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Practice
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity & AI Quick Questions Hub */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Real Activity List */}
        <Card className="lg:col-span-4 bg-white border-slate-200/90 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Recent Activity</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500 mt-0.5">Your latest learning events across all spaces.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 font-medium">
              <Link to="/spaces">View Spaces</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !analytics?.recentEvents || analytics.recentEvents.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No recent activity yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your activity history will appear here once you create spaces, upload documents, or take quizzes.
                </p>
                <div className="mt-4">
                  <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    <Link to="/spaces">Create a Space</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.recentEvents.map((event: any) => (
                  <div key={event.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-0.5 shrink-0">
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {getEventDescription(event)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatEventTime(event.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Quick Questions & Action Hub */}
        <Card className="lg:col-span-3 bg-white border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                      AI Quick Questions
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Click any AI suggestion to ask the AI Tutor immediately.
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : aiSuggestedQuestions.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-xl bg-slate-50/50 p-4">
                  <MessageSquare className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Upload a PDF to receive targeted AI question suggestions.</p>
                </div>
              ) : (
                aiSuggestedQuestions.map((item: any) => {
                  const tutorUrl = `/projects/${item.projectId}/tutor?q=${encodeURIComponent(item.question)}`;
                  return (
                    <Link
                      key={item.id}
                      to={tutorUrl}
                      className="group flex items-start justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-300 transition-all shadow-2xs"
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200/60">
                            {item.tag}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 truncate">
                            {item.topic}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-900 line-clamp-2 leading-snug">
                          "{item.question}"
                        </p>
                      </div>
                      <div className="p-1 rounded-md text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-100/70 transition-colors shrink-0 mt-1">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </div>

          {/* Quick Space & Course Shortcuts */}
          <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/40 rounded-b-xl">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
              <span>Quick Navigation</span>
              <Link to="/spaces" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                Browse Spaces <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild size="sm" variant="outline" className="w-full text-xs h-8 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium">
                <Link to="/spaces">
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> New Space
                </Link>
              </Button>
              {continueLearning && (
                <Button asChild size="sm" variant="outline" className="w-full text-xs h-8 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium">
                  <Link to={`/projects/${continueLearning.projectId}/documents`}>
                    <FileText className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Documents
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

