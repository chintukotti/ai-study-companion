import React, { useState } from 'react';
import { 
  Users, 
  Cpu, 
  Activity, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAdminStats, useAdminUsers, useAdminAIUsage } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from '@/components/ui/table';

export const AdminDashboardPage = () => {
  const { data: stats, isLoading: isStatsLoading } = useAdminStats();
  const { data: users, isLoading: isUsersLoading } = useAdminUsers();
  const { data: aiData, isLoading: isAiUsageLoading } = useAdminAIUsage();

  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'users'>('overview');

  const summary = aiData?.summary || {
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    avgLatencyMs: 0,
    successRate: 100,
  };

  const models = aiData?.models || {};
  const logs = aiData?.logs || [];

  return (
    <div className="container mx-auto space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-purple-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Observability Dashboard</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Platform monitoring, AI token accounting, request latency, and user management.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg border text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'overview' ? 'bg-white text-purple-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview & Models
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'logs' ? 'bg-white text-purple-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Usage Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'users' ? 'bg-white text-purple-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users ({users?.length || 0})
          </button>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats?.totalUsers || users?.length || 0}</div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Registered platform learners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Input Tokens</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isAiUsageLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                {summary.totalInputTokens.toLocaleString()}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Prompt & context tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Output Tokens</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {isAiUsageLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-indigo-600">
                {summary.totalOutputTokens.toLocaleString()}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Generated completion tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Total AI Cost</CardTitle>
            <Coins className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isAiUsageLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-amber-600">
                ${summary.totalCost.toFixed(4)}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Total {summary.totalTokens.toLocaleString()} tokens used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overview Tab: Model Breakdown & Platform Stats */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Secondary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Total AI Calls</span>
                <p className="text-lg font-bold text-slate-800">{summary.totalCalls}</p>
              </div>
              <Cpu className="h-6 w-6 text-purple-500 opacity-80" />
            </div>

            <div className="bg-white border rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Average Latency</span>
                <p className="text-lg font-bold text-slate-800">{summary.avgLatencyMs} ms</p>
              </div>
              <Clock className="h-6 w-6 text-blue-500 opacity-80" />
            </div>

            <div className="bg-white border rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Success Rate</span>
                <p className="text-lg font-bold text-emerald-600">{summary.successRate}%</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-80" />
            </div>
          </div>

          {/* Model Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-purple-600" />
                AI Model Usage & Token Accounting
              </CardTitle>
              <CardDescription>
                Breakdown of input and output tokens consumed per AI model
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAiUsageLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : Object.keys(models).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Model Name</TableHead>
                        <TableHead className="text-right">Total Calls</TableHead>
                        <TableHead className="text-right">Input Tokens</TableHead>
                        <TableHead className="text-right">Output Tokens</TableHead>
                        <TableHead className="text-right">Total Tokens</TableHead>
                        <TableHead className="text-right">Avg Latency</TableHead>
                        <TableHead className="text-right">Est. Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(models).map(([modelName, data]: [string, any]) => (
                        <TableRow key={modelName}>
                          <TableCell className="font-semibold text-slate-900">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-mono border border-purple-200">
                              {modelName}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{data.calls}</TableCell>
                          <TableCell className="text-right text-emerald-700 font-mono text-xs">
                            {data.inputTokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-indigo-700 font-mono text-xs">
                            {data.outputTokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                            {data.totalTokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-xs text-slate-600">
                            {data.avgLatency} ms
                          </TableCell>
                          <TableCell className="text-right font-semibold text-amber-700 text-xs">
                            ${data.estimatedCost}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No AI usage recorded yet. Interactions with the AI Tutor, Quizzes, and Document embeddings will automatically log token usage here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Tab: Detailed Request-by-Request Observability */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4 text-blue-600" />
              Live AI Interaction & Token Logs
            </CardTitle>
            <CardDescription>
              Every request made to Gemini or embedding models with exact input and output token consumption.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAiUsageLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : logs.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Input Tokens</TableHead>
                      <TableHead className="text-right">Output Tokens</TableHead>
                      <TableHead className="text-right">Total Tokens</TableHead>
                      <TableHead className="text-right">Latency</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {log.operation}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-600">
                          {log.model}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-emerald-700">
                          {Number(log.input_tokens || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-indigo-700">
                          {Number(log.output_tokens || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono font-bold text-slate-800">
                          {(Number(log.input_tokens || 0) + Number(log.output_tokens || 0)).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">
                          {log.latency_ms} ms
                        </TableCell>
                        <TableCell className="text-center">
                          {log.success !== false ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200" title={log.error}>
                              Failed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm">
                No recent request logs found.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Users Tab: Platform User Management */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-blue-600" />
              Platform Registered Users
            </CardTitle>
            <CardDescription>
              All registered users, roles, and account creation dates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isUsersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Account Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-semibold text-slate-800">
                          {u.full_name || 'Anonymous User'}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">{u.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            u.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role === 'admin' ? 'Administrator' : 'Student'}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {new Date(u.created_at || Date.now()).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                No users found.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
