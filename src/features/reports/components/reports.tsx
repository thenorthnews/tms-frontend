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
  PieChart as PieIcon,
} from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

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

    csvContent +=
      'Employee Name,Role,Tasks Assigned,Tasks Completed,Completion Rate %,Avg. Days to Complete,Total Logged Time\n';
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
  const pctCompleted =
    summary.totalTasks > 0 ? summary.completedTasks / summary.totalTasks : 0.6;
  const pctInProgress =
    summary.totalTasks > 0
      ? summary.inProgressTasks / summary.totalTasks
      : 0.25;
  const pctPending =
    summary.totalTasks > 0 ? summary.pendingTasks / summary.totalTasks : 0.15;

  const strokeCompleted = circumference * pctCompleted;
  const strokeInProgress = circumference * pctInProgress;
  const strokePending = circumference * pctPending;

  return (
    <div className="space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4 sm:space-y-8">
      {/* Top Banner and Filter Control bar */}
      <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-slate-700/20 bg-gradient-to-r from-[#1E3A8A] via-[#10348a] to-[#0A192F] p-6 text-white shadow-lg sm:p-8 xl:flex-row xl:items-center">
        <div className="pointer-events-none absolute right-0 top-0 size-80 rounded-full bg-[#0EA5E9]/10 blur-3xl" />
        <div className="z-10 space-y-2 text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/10 px-3 py-1 text-xs font-bold text-[#0EA5E9] backdrop-blur-sm">
            <BarChart3 className="size-3.5" />
            Server Aggregations
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Reports & Performance metrics
          </h1>
          <p className="max-w-xl text-xs font-medium text-slate-300 sm:text-sm">
            Monitor organizational productivity, track backlog priority layout,
            review completion trends, and download data exports.
          </p>
        </div>

        {/* Filters and Download Options */}
        <div className="z-10 mt-2 flex flex-wrap items-center gap-3 xl:mt-0">
          {/* Scope Filters */}
          <div className="flex items-center rounded-xl border border-white/5 bg-white/10 p-1 text-xs font-semibold backdrop-blur-sm">
            <button
              onClick={() => setDateRange('week')}
              className={`cursor-pointer rounded-lg border-0 px-3 py-1.5 transition-all ${
                dateRange === 'week'
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'bg-transparent text-slate-300 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`cursor-pointer rounded-lg border-0 px-3 py-1.5 transition-all ${
                dateRange === 'month'
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'bg-transparent text-slate-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`cursor-pointer rounded-lg border-0 px-3 py-1.5 transition-all ${
                dateRange === 'all'
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'bg-transparent text-slate-300 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Priority dropdown selector */}
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/10 px-3 py-1.5 text-xs backdrop-blur-sm">
            <Filter className="size-3.5 text-[#0EA5E9]" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="cursor-pointer border-0 bg-transparent font-bold text-white focus:outline-none"
            >
              <option value="all" className="bg-[#0A192F] text-white">
                All Priorities
              </option>
              <option value="low" className="bg-[#0A192F] text-white">
                Low Priority
              </option>
              <option value="medium" className="bg-[#0A192F] text-white">
                Medium Priority
              </option>
              <option value="high" className="bg-[#0A192F] text-white">
                High Priority
              </option>
            </select>
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportCSV}
            className="flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-[#10B981] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-[#10B981]/90"
          >
            <Download className="size-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {/* Total scope tasks */}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
              Filtered Tasks
            </span>
            <span className="block text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {summary.totalTasks}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">
              Total within date scope
            </span>
          </div>
          <div className="size-12.5 flex shrink-0 items-center justify-center rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A] sm:size-14">
            <TrendingUp className="sm:size-6.5 size-6" />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
              Completion Rate
            </span>
            <span className="block text-2xl font-extrabold text-[#10B981] sm:text-3xl">
              {summary.completionRate}%
            </span>
            <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">
              Closed vs assigned ratio
            </span>
          </div>
          <div className="size-12.5 flex shrink-0 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981] sm:size-14">
            <CheckCircle2 className="sm:size-6.5 size-6" />
          </div>
        </div>

        {/* In Progress */}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
              Active Tasks
            </span>
            <span className="block text-2xl font-extrabold text-[#0EA5E9] sm:text-3xl">
              {summary.inProgressTasks}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">
              Under development sprint
            </span>
          </div>
          <div className="size-12.5 flex shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9] sm:size-14">
            <ArrowUpRight className="sm:size-6.5 size-6" />
          </div>
        </div>

        {/* Backlog Pending */}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
              Pending Backlog
            </span>
            <span className="block text-2xl font-extrabold text-[#F59E0B] sm:text-3xl">
              {summary.pendingTasks}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">
              Awaiting engineering seat
            </span>
          </div>
          <div className="size-12.5 flex shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] sm:size-14">
            <AlertCircle className="sm:size-6.5 size-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donut Chart: Completion Status */}
        <div className="flex flex-col rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieIcon className="size-4.5 text-[#0EA5E9]" />
            <h3 className="text-base font-bold text-slate-800">
              Task Completion Overview
            </h3>
          </div>

          <div className="flex flex-col items-center justify-around gap-6 py-4 sm:flex-row">
            <div className="relative size-36 shrink-0">
              <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="fill-none stroke-slate-100"
                  strokeWidth="12"
                />

                {/* Completed slice */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="fill-none stroke-[#10B981] transition-all duration-500"
                  strokeWidth="12"
                  strokeDasharray={`${strokeCompleted} ${circumference}`}
                  strokeDashoffset="0"
                />

                {/* In Progress slice */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="fill-none stroke-[#0EA5E9] transition-all duration-500"
                  strokeWidth="12"
                  strokeDasharray={`${strokeInProgress} ${circumference}`}
                  strokeDashoffset={`-${strokeCompleted}`}
                />

                {/* Pending slice */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="fill-none stroke-[#F59E0B] transition-all duration-500"
                  strokeWidth="12"
                  strokeDasharray={`${strokePending} ${circumference}`}
                  strokeDashoffset={`-${strokeCompleted + strokeInProgress}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-900">
                  {summary.completionRate}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Done rate
                </span>
              </div>
            </div>

            {/* Legends & stats details */}
            <div className="w-full max-w-xs space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded bg-[#10B981]" />
                  <span className="font-bold text-slate-600">Completed</span>
                </div>
                <strong className="font-extrabold text-slate-800">
                  {summary.completedTasks} tasks
                </strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded bg-[#0EA5E9]" />
                  <span className="font-bold text-slate-600">In Progress</span>
                </div>
                <strong className="font-extrabold text-slate-800">
                  {summary.inProgressTasks} tasks
                </strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded bg-[#F59E0B]" />
                  <span className="font-bold text-slate-600">Pending</span>
                </div>
                <strong className="font-extrabold text-slate-800">
                  {summary.pendingTasks} tasks
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Priority Distribution */}
        <div className="flex flex-col rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BarChart3 className="size-4.5 text-[#0EA5E9]" />
            <h3 className="text-base font-bold text-slate-800">
              Priority Volume distribution
            </h3>
          </div>

          <div className="flex flex-1 flex-col justify-around py-2">
            {/* Low Priority bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Low Priority</span>
                <span className="font-extrabold text-slate-800">
                  {priorities.low} tasks
                </span>
              </div>
              <div className="flex h-3.5 w-full overflow-hidden rounded-lg bg-slate-100">
                <div
                  className="h-full rounded-lg bg-slate-400 transition-all duration-500"
                  style={{
                    width: `${summary.totalTasks > 0 ? (priorities.low / summary.totalTasks) * 100 : 25}%`,
                  }}
                />
              </div>
            </div>

            {/* Medium Priority bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">
                  Medium Priority
                </span>
                <span className="font-extrabold text-slate-800">
                  {priorities.medium} tasks
                </span>
              </div>
              <div className="flex h-3.5 w-full overflow-hidden rounded-lg bg-slate-100">
                <div
                  className="h-full rounded-lg bg-[#0EA5E9] transition-all duration-500"
                  style={{
                    width: `${summary.totalTasks > 0 ? (priorities.medium / summary.totalTasks) * 100 : 50}%`,
                  }}
                />
              </div>
            </div>

            {/* High Priority bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">High Priority</span>
                <span className="font-extrabold text-slate-800">
                  {priorities.high} tasks
                </span>
              </div>
              <div className="flex h-3.5 w-full overflow-hidden rounded-lg bg-slate-100">
                <div
                  className="h-full rounded-lg bg-[#F59E0B] transition-all duration-500"
                  style={{
                    width: `${summary.totalTasks > 0 ? (priorities.high / summary.totalTasks) * 100 : 25}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster performance table */}
      <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="border-b border-slate-100 pb-4 text-left">
          <h3 className="text-base font-bold text-slate-800 sm:text-lg">
            Employee Workload & Performance
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Average completion metrics calculated from database logs
          </p>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="select-none border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-2 py-3">Employee Name</th>
                <th className="px-2 py-3">Role</th>
                <th className="px-2 py-3">Assigned</th>
                <th className="px-2 py-3">Completed</th>
                <th className="px-2 py-3">Completion Rate</th>
                <th className="px-2 py-3">Avg. Completion Time</th>
                <th className="px-2 py-3">Total Logged Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeePerformance.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center font-bold text-slate-400"
                  >
                    No records found in database registry.
                  </td>
                </tr>
              ) : (
                employeePerformance.map((emp) => (
                  <tr
                    key={emp.id}
                    className="transition-colors odd:bg-slate-50/10 even:bg-white hover:bg-slate-50/40"
                  >
                    <td className="px-2 py-3.5 text-sm font-bold text-slate-800">
                      {emp.name}
                    </td>
                    <td className="px-2 py-3.5 font-semibold text-slate-600">
                      {emp.role}
                    </td>
                    <td className="px-2 py-3.5 text-sm font-bold text-slate-500">
                      {emp.assigned}
                    </td>
                    <td className="px-2 py-3.5 text-sm font-bold text-emerald-600">
                      {emp.completed}
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#10B981]"
                            style={{ width: `${emp.rate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">
                          {emp.rate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {emp.avgTime} days
                      </div>
                    </td>
                    <td className="px-2 py-3.5 font-bold text-slate-700">
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
