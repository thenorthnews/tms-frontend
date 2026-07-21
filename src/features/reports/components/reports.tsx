import * as React from 'react';
import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowUpRight,
  PieChart as PieIcon
} from 'lucide-react';

import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { useReports } from '../api/get-reports';

export const ReportsDashboard = () => {
  const { addNotification } = useNotifications();

  // --- FILTERS STATE ---
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // --- QUERY REAL PRE-CALCULATED BACKEND DATA ---
  const reportsQuery = useReports({
    params: {
      dateRange,
      priority: priorityFilter,
    },
  });

  if (reportsQuery.isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const reportsData = reportsQuery.data;

  // Retrieve calculated structures from backend response
  const summary = reportsData?.summary || {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
  };

  const priorities = reportsData?.priorities || {
    low: 0,
    medium: 0,
    high: 0,
  };

  const employeePerformance = reportsData?.employeePerformance || [];

  // Exporter: Trigger download of CSV report
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'TaskFlow Performance Report (Server Computed)\n';
    csvContent += `Generated On: ${new Date().toLocaleDateString()}\n`;
    csvContent += `Date Scope: ${dateRange.toUpperCase()}\n`;
    csvContent += `Priority Filter: ${priorityFilter.toUpperCase()}\n\n`;

    csvContent += 'Employee Name,Role,Tasks Assigned,Tasks Completed,Completion Rate %,Avg. Days to Complete,Total Logged Time\n';
    employeePerformance.forEach((e) => {
      csvContent += `"${e.name}","${e.role}",${e.assigned},${e.completed},${e.rate}%,${e.avgTime} days,"${e.loggedTime || '0h 0m'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `taskflow_server_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addNotification({
      type: 'success',
      title: 'Server report exported successfully',
      message: 'Your report CSV spreadsheet has been downloaded.',
    });
  };

  // SVG Donut Calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const pctCompleted = summary.totalTasks > 0 ? (summary.completedTasks / summary.totalTasks) : 0.6;
  const pctInProgress = summary.totalTasks > 0 ? (summary.inProgressTasks / summary.totalTasks) : 0.25;
  const pctPending = summary.totalTasks > 0 ? (summary.pendingTasks / summary.totalTasks) : 0.15;

  const strokeCompleted = circumference * pctCompleted;
  const strokeInProgress = circumference * pctInProgress;
  const strokePending = circumference * pctPending;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Top Banner and Filter Control bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-[#1E3A8A] via-[#10348a] to-[#0A192F] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-slate-700/20">
        <div className="absolute right-0 top-0 size-80 bg-[#0EA5E9]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#0EA5E9] text-xs font-bold border border-white/5 backdrop-blur-sm">
            <BarChart3 className="size-3.5" />
            Server Aggregations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Reports & Performance metrics</h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium">
            Monitor organizational productivity, track backlog priority layout, review completion trends, and download data exports.
          </p>
        </div>

        {/* Filters and Download Options */}
        <div className="flex flex-wrap items-center gap-3 z-10 mt-2 xl:mt-0">

          {/* Scope Filters */}
          <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/5 text-xs font-semibold">
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-lg transition-all border-0 cursor-pointer ${dateRange === 'week' ? 'bg-[#0EA5E9] text-white shadow-sm' : 'text-slate-300 hover:text-white bg-transparent'
                }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-lg transition-all border-0 cursor-pointer ${dateRange === 'month' ? 'bg-[#0EA5E9] text-white shadow-sm' : 'text-slate-300 hover:text-white bg-transparent'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all border-0 cursor-pointer ${dateRange === 'all' ? 'bg-[#0EA5E9] text-white shadow-sm' : 'text-slate-300 hover:text-white bg-transparent'
                }`}
            >
              All Time
            </button>
          </div>

          {/* Priority dropdown selector */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/5 text-xs">
            <Filter className="size-3.5 text-[#0EA5E9]" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-white border-0 focus:outline-none cursor-pointer font-bold"
            >
              <option value="all" className="bg-[#0A192F] text-white">All Priorities</option>
              <option value="low" className="bg-[#0A192F] text-white">Low Priority</option>
              <option value="medium" className="bg-[#0A192F] text-white">Medium Priority</option>
              <option value="high" className="bg-[#0A192F] text-white">High Priority</option>
            </select>
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer border-0"
          >
            <Download className="size-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

        {/* Total scope tasks */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Filtered Tasks
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {summary.totalTasks}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Total within date scope</span>
          </div>
          <div className="flex size-12.5 sm:size-14 items-center justify-center rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A] shrink-0">
            <TrendingUp className="size-6 sm:size-6.5" />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Completion Rate
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#10B981] block">
              {summary.completionRate}%
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Closed vs assigned ratio</span>
          </div>
          <div className="flex size-12.5 sm:size-14 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981] shrink-0">
            <CheckCircle2 className="size-6 sm:size-6.5" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Tasks
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0EA5E9] block">
              {summary.inProgressTasks}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Under development sprint</span>
          </div>
          <div className="flex size-12.5 sm:size-14 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9] shrink-0">
            <ArrowUpRight className="size-6 sm:size-6.5" />
          </div>
        </div>

        {/* Backlog Pending */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Pending Backlog
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F59E0B] block">
              {summary.pendingTasks}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Awaiting engineering seat</span>
          </div>
          <div className="flex size-12.5 sm:size-14 items-center justify-center rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] shrink-0">
            <AlertCircle className="size-6 sm:size-6.5" />
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut Chart: Completion Status */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col text-left">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <PieIcon className="size-4.5 text-[#0EA5E9]" />
            <h3 className="text-base font-bold text-slate-800">Task Completion Overview</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            <div className="relative size-36 shrink-0">
              <svg className="size-full rotate-[-90deg]" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} className="stroke-slate-100 fill-none" strokeWidth="12" />

                {/* Completed slice */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-[#10B981] fill-none transition-all duration-500"
                  strokeWidth="12"
                  strokeDasharray={`${strokeCompleted} ${circumference}`}
                  strokeDashoffset="0"
                />

                {/* In Progress slice */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-[#0EA5E9] fill-none transition-all duration-500"
                  strokeWidth="12"
                  strokeDasharray={`${strokeInProgress} ${circumference}`}
                  strokeDashoffset={`-${strokeCompleted}`}
                />

                {/* Pending slice */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-[#F59E0B] fill-none transition-all duration-500"
                  strokeWidth="12"
                  strokeDasharray={`${strokePending} ${circumference}`}
                  strokeDashoffset={`-${strokeCompleted + strokeInProgress}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-900">{summary.completionRate}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Done rate</span>
              </div>
            </div>

            {/* Legends & stats details */}
            <div className="space-y-3.5 w-full max-w-xs text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded bg-[#10B981]" />
                  <span className="font-bold text-slate-600">Completed</span>
                </div>
                <strong className="text-slate-800 font-extrabold">{summary.completedTasks} tasks</strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded bg-[#0EA5E9]" />
                  <span className="font-bold text-slate-600">In Progress</span>
                </div>
                <strong className="text-slate-800 font-extrabold">{summary.inProgressTasks} tasks</strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded bg-[#F59E0B]" />
                  <span className="font-bold text-slate-600">Pending</span>
                </div>
                <strong className="text-slate-800 font-extrabold">{summary.pendingTasks} tasks</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Priority Distribution */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col text-left">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <BarChart3 className="size-4.5 text-[#0EA5E9]" />
            <h3 className="text-base font-bold text-slate-800">Priority Volume distribution</h3>
          </div>

          <div className="flex-1 flex flex-col justify-around py-2">

            {/* Low Priority bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Low Priority</span>
                <span className="font-extrabold text-slate-800">{priorities.low} tasks</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-lg overflow-hidden flex">
                <div
                  className="bg-slate-400 h-full rounded-lg transition-all duration-500"
                  style={{ width: `${summary.totalTasks > 0 ? (priorities.low / summary.totalTasks) * 100 : 25}%` }}
                />
              </div>
            </div>

            {/* Medium Priority bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Medium Priority</span>
                <span className="font-extrabold text-slate-800">{priorities.medium} tasks</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-lg overflow-hidden flex">
                <div
                  className="bg-[#0EA5E9] h-full rounded-lg transition-all duration-500"
                  style={{ width: `${summary.totalTasks > 0 ? (priorities.medium / summary.totalTasks) * 100 : 50}%` }}
                />
              </div>
            </div>

            {/* High Priority bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">High Priority</span>
                <span className="font-extrabold text-slate-800">{priorities.high} tasks</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-lg overflow-hidden flex">
                <div
                  className="bg-[#F59E0B] h-full rounded-lg transition-all duration-500"
                  style={{ width: `${summary.totalTasks > 0 ? (priorities.high / summary.totalTasks) * 100 : 25}%` }}
                />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Roster performance table */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 text-left">
          <h3 className="text-base sm:text-lg font-bold text-slate-800">Employee Workload & Performance</h3>
          <p className="text-xs text-slate-400 mt-0.5">Average completion metrics calculated from database logs</p>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] select-none">
                <th className="py-3 px-2">Employee Name</th>
                <th className="py-3 px-2">Role</th>
                <th className="py-3 px-2">Assigned</th>
                <th className="py-3 px-2">Completed</th>
                <th className="py-3 px-2">Completion Rate</th>
                <th className="py-3 px-2">Avg. Completion Time</th>
                <th className="py-3 px-2">Total Logged Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeePerformance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 font-bold">
                    No records found in database registry.
                  </td>
                </tr>
              ) : (
                employeePerformance.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors odd:bg-slate-50/10 even:bg-white">
                    <td className="py-3.5 px-2 font-bold text-slate-800 text-sm">
                      {emp.name}
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-600">
                      {emp.role}
                    </td>
                    <td className="py-3.5 px-2 font-bold text-slate-500 text-sm">
                      {emp.assigned}
                    </td>
                    <td className="py-3.5 px-2 font-bold text-emerald-600 text-sm">
                      {emp.completed}
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden flex">
                          <div
                            className="bg-[#10B981] h-full rounded-full"
                            style={{ width: `${emp.rate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{emp.rate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {emp.avgTime} days
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-bold text-slate-700">
                      {emp.loggedTime || '0h 0m'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
