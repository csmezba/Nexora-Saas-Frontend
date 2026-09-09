'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  ORGANIZATION_PROJECTS_QUERY,
  PROJECT_TASKS_QUERY,
  CREATE_TASK_MUTATION,
  UPDATE_TASK_MUTATION,
  UPDATE_TASK_POSITION_MUTATION,
  DELETE_TASK_MUTATION,
  ASSIGN_TASK_MUTATION,
  UNASSIGN_TASK_MUTATION,
  CREATE_TASK_COMMENT_MUTATION,
  ADD_TASK_DEPENDENCY_MUTATION,
  REMOVE_TASK_DEPENDENCY_MUTATION,
  CREATE_PROJECT_MUTATION,
  MY_ORGANIZATIONS_QUERY,
  ORGANIZATION_MEMBERS_QUERY,
  PROJECT_SPRINTS_QUERY,
  SPRINT_QUERY,
  CREATE_SPRINT_MUTATION,
  UPDATE_SPRINT_MUTATION,
  DELETE_SPRINT_MUTATION,
  ADD_TASK_TO_SPRINT_MUTATION,
  REMOVE_TASK_FROM_SPRINT_MUTATION,
} from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import {
  CheckSquare,
  Plus,
  Search,
  Kanban,
  List,
  Calendar as CalendarIcon,
  Sparkles,
  User,
  UserPlus,
  Users,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  X,
  FolderKanban,
  Loader2,
  Trash2,
  Edit2,
  Save,
  Check,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Link2,
  Send,
  CornerDownRight,
  Play,
} from 'lucide-react';

export type TaskStatusType = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

const COLUMNS: { id: TaskStatusType; label: string; color: string; badge: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', color: 'border-slate-800 bg-slate-900/40', badge: 'bg-slate-800 text-slate-400' },
  { id: 'TODO', label: 'To Do', color: 'border-indigo-950 bg-indigo-950/10', badge: 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/80' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-950 bg-amber-950/10', badge: 'bg-amber-950/80 text-amber-300 border border-amber-800/80' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'border-purple-950 bg-purple-950/10', badge: 'bg-purple-950/80 text-purple-300 border border-purple-800/80' },
  { id: 'DONE', label: 'Done', color: 'border-emerald-950 bg-emerald-950/10', badge: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80' },
];

interface CalendarDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  placeholder?: string;
}

function CalendarDatePicker({ value, onChange, placeholder = 'Select due date...' }: CalendarDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) setViewDate(d);
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const selectDate = (d: Date) => {
    onChange(formatDateStr(d));
    setIsOpen(false);
  };

  const today = new Date();
  const todayStr = formatDateStr(today);

  const presets = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: new Date(Date.now() + 86400000) },
    {
      label: 'Friday',
      date: (() => {
        const d = new Date();
        const diff = (5 - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        return d;
      })(),
    },
    {
      label: 'Next Wk',
      date: (() => {
        const d = new Date();
        const diff = (1 - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        return d;
      })(),
    },
  ];

  const formattedDisplay = value
    ? (() => {
        try {
          const parts = value.split('-');
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
        } catch {
          return value;
        }
      })()
    : null;

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3 py-2 bg-slate-950 border rounded-lg text-xs cursor-pointer transition-colors ${
          isOpen ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className={`truncate font-mono ${formattedDisplay ? 'text-slate-100 font-semibold' : 'text-slate-500'}`}>
            {formattedDisplay || placeholder}
          </span>
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            title="Clear date"
            className="p-0.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3.5 space-y-3 font-sans animate-in fade-in zoom-in-95 duration-150">
            {/* Quick Presets */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800/80">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectDate(p.date);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-400 rounded text-[10px] font-mono whitespace-nowrap cursor-pointer transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Month & Year Navigator */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-200 font-mono">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 text-center font-mono text-[10px] text-slate-500 font-semibold">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
              {/* Previous Month Padding */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <span key={`prev-${i}`} className="p-1 text-slate-600 text-[11px] opacity-40">
                  {prevMonthDays - firstDayOfWeek + i + 1}
                </span>
              ))}

              {/* Days in Month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const d = new Date(year, month, dayNum);
                const dStr = formatDateStr(d);
                const isSelected = value === dStr;
                const isToday = todayStr === dStr;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectDate(d);
                    }}
                    className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center text-[11px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : isToday
                        ? 'bg-slate-800 text-indigo-300 font-bold border border-indigo-500/50'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-slate-500 hover:text-rose-400 cursor-pointer font-mono"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  selectDate(today);
                }}
                className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-semibold font-mono"
              >
                Today
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { accessToken, selectedOrgPubId, selectedOrgSlug, selectedOrgName, user } = useAuthStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Drag-and-drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatusType | null>(null);

  // Selected Task for Edit/View Drawer
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatusType>('TODO');
  const [editPriority, setEditPriority] = useState<TaskPriorityType>('MEDIUM');
  const [editDueDate, setEditDueDate] = useState('');

  // Create Task state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createColumnTarget, setCreateColumnTarget] = useState<TaskStatusType>('TODO');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriorityType>('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');
  const [selectedAssigneePubIds, setSelectedAssigneePubIds] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newDependencyTaskId, setNewDependencyTaskId] = useState('');
  const [newDependencyType, setNewDependencyType] = useState<'BLOCKS' | 'RELATES_TO'>('BLOCKS');

  // Drawer Assign Member state
  const [assignSelectPubId, setAssignSelectPubId] = useState<string>('');
  const [drawerCommentText, setDrawerCommentText] = useState('');
  const [drawerDepTaskId, setDrawerDepTaskId] = useState('');
  const [drawerDepType, setDrawerDepType] = useState<'BLOCKS' | 'RELATES_TO'>('BLOCKS');

  // Quick Create Project Modal state (if workspace has 0 projects)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sprint Management state
  const [selectedSprintPubId, setSelectedSprintPubId] = useState<string>('');
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);
  const [showEditSprintModal, setShowEditSprintModal] = useState(false);
  const [showDeleteSprintModal, setShowDeleteSprintModal] = useState(false);

  // Create Sprint form
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintStartDate, setSprintStartDate] = useState('');
  const [sprintEndDate, setSprintEndDate] = useState('');
  const [sprintStatus, setSprintStatus] = useState<'PLANNED' | 'ACTIVE' | 'COMPLETED'>('PLANNED');

  // Edit Sprint form
  const [editSprintName, setEditSprintName] = useState('');
  const [editSprintGoal, setEditSprintGoal] = useState('');
  const [editSprintStartDate, setEditSprintStartDate] = useState('');
  const [editSprintEndDate, setEditSprintEndDate] = useState('');
  const [editSprintStatus, setEditSprintStatus] = useState<'PLANNED' | 'ACTIVE' | 'COMPLETED'>('PLANNED');

  // Drawer & Create Modal Sprint state
  const [drawerSprintSelectPubId, setDrawerSprintSelectPubId] = useState<string>('');
  const [newSprintPubId, setNewSprintPubId] = useState<string>('');

  // 1. Resolve Organization
  const { data: myOrgs = [] } = useQuery({
    queryKey: ['myOrganizations', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      const res = await graphqlRequest<{ myOrganizations: any[] }>(MY_ORGANIZATIONS_QUERY);
      return res.myOrganizations || [];
    },
    enabled: !!accessToken,
  });

  const validOrgs = Array.isArray(myOrgs) ? myOrgs.filter((o: any) => o && typeof o === 'object') : [];
  const activeOrg =
    validOrgs.find(
      (o: any) =>
        (selectedOrgPubId && o.pubId === selectedOrgPubId) ||
        (selectedOrgSlug && o.slug === selectedOrgSlug)
    ) ||
    validOrgs[0] ||
    null;

  const effectiveOrgPubId = selectedOrgPubId || activeOrg?.pubId || '';
  const currentOrgName = activeOrg?.name?.trim() || selectedOrgName || 'Workspace';
  const orgSlug = activeOrg?.slug?.trim() || selectedOrgSlug || 'workspace';

  // 2. Fetch Projects for active organization
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['organizationProjects', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ organizationProjects: any[] }>(
        ORGANIZATION_PROJECTS_QUERY,
        { organizationPubId: effectiveOrgPubId }
      );
      return res.organizationProjects || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // Active Project Selection
  const [selectedProjectPubId, setSelectedProjectPubId] = useState<string>('');

  useEffect(() => {
    if (projects.length > 0) {
      if (!selectedProjectPubId || !projects.some((p: any) => p.pubId === selectedProjectPubId)) {
        setSelectedProjectPubId(projects[0].pubId);
        setSelectedSprintPubId('');
      }
    } else {
      setSelectedProjectPubId('');
      setSelectedSprintPubId('');
    }
  }, [projects, selectedProjectPubId]);

  const activeProject = projects.find((p: any) => p.pubId === selectedProjectPubId) || projects[0] || null;

  // 3. Fetch Sprints for selected project from database
  const { data: sprints = [], isLoading: isSprintsLoading } = useQuery({
    queryKey: ['projectSprints', selectedProjectPubId],
    queryFn: async () => {
      if (!selectedProjectPubId) return [];
      const res = await graphqlRequest<{ projectSprints: any[] }>(PROJECT_SPRINTS_QUERY, {
        projectPubId: selectedProjectPubId,
      });
      return res.projectSprints || [];
    },
    enabled: !!selectedProjectPubId && !!accessToken,
  });

  const activeSprint = sprints.find((s: any) => s.pubId === selectedSprintPubId) || null;

  // 4. Fetch Tasks for selected project from database (filtered by sprint if selected)
  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['projectTasks', selectedProjectPubId, selectedSprintPubId],
    queryFn: async () => {
      if (!selectedProjectPubId) return [];
      const res = await graphqlRequest<{ projectTasks: any[] }>(PROJECT_TASKS_QUERY, {
        projectPubId: selectedProjectPubId,
        sprintPubId: selectedSprintPubId || undefined,
      });
      return res.projectTasks || [];
    },
    enabled: !!selectedProjectPubId && !!accessToken,
  });

  // Sprint Progress stats
  const sprintTotalCount = activeSprint ? tasks.length : 0;
  const sprintDoneCount = activeSprint ? tasks.filter((t: any) => t.status === 'DONE').length : 0;
  const sprintProgressPercent =
    sprintTotalCount > 0 ? Math.round((sprintDoneCount / sprintTotalCount) * 100) : 0;

  // 5. Fetch Organization Members for task assignment
  const { data: members = [] } = useQuery({
    queryKey: ['organizationMembers', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ organizationMembers: any[] }>(
        ORGANIZATION_MEMBERS_QUERY,
        { organizationPubId: effectiveOrgPubId }
      );
      return res.organizationMembers || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // Keep selectedTask assignees, comments, dependencies in sync when tasks query refetches
  useEffect(() => {
    if (selectedTask) {
      const latest = tasks.find((t: any) => t.pubId === selectedTask.pubId);
      if (latest) {
        setSelectedTask((prev: any) => ({
          ...prev,
          assignees: latest.assignees,
          comments: latest.comments,
          dependencies: latest.dependencies,
          status: latest.status,
          priority: latest.priority,
          position: latest.position,
        }));
      }
    }
  }, [tasks]);

  // Sync selected task edit state
  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title || '');
      setEditDesc(selectedTask.description || '');
      setEditStatus((selectedTask.status as TaskStatusType) || 'TODO');
      setEditPriority((selectedTask.priority as TaskPriorityType) || 'MEDIUM');
      setEditDueDate(selectedTask.dueDate ? selectedTask.dueDate.slice(0, 10) : '');
    }
  }, [selectedTask]);

  // 4. Mutation: Update Task Position (Drag and Drop / Column change)
  const updateTaskPositionMutation = useMutation({
    mutationFn: async ({
      taskPubId,
      status,
      position,
    }: {
      taskPubId: string;
      status: TaskStatusType;
      position: number;
    }) => {
      return graphqlRequest<{ updateTaskPosition: any }>(UPDATE_TASK_POSITION_MUTATION, {
        input: {
          taskPubId,
          status,
          position,
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
      if (selectedTask && selectedTask.pubId === data.updateTaskPosition.pubId) {
        setSelectedTask((prev: any) => ({
          ...prev,
          status: data.updateTaskPosition.status,
          position: data.updateTaskPosition.position,
        }));
      }
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to update task position.',
      });
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
    },
  });

  // 5. Mutation: Create Task (with optional initial comment & dependency)
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectPubId) throw new Error('No project selected.');
      // 1. Create base task
      const res = await graphqlRequest<{ createTask: any }>(CREATE_TASK_MUTATION, {
        input: {
          projectPubId: selectedProjectPubId,
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          status: createColumnTarget,
          priority: newPriority,
          dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
          position: (tasks.length + 1) * 1000.0,
          assigneeUserPubIds: selectedAssigneePubIds.length > 0 ? selectedAssigneePubIds : undefined,
          sprintPubId: newSprintPubId || (selectedSprintPubId || undefined),
        },
      });

      const created = res?.createTask;
      if (created?.pubId) {
        // 2. Optional initial comment
        if (newComment.trim()) {
          try {
            await graphqlRequest(CREATE_TASK_COMMENT_MUTATION, {
              input: {
                taskPubId: created.pubId,
                content: newComment.trim(),
              },
            });
          } catch (cErr) {
            console.warn('Initial comment error:', cErr);
          }
        }

        // 3. Optional initial dependency
        if (newDependencyTaskId) {
          try {
            await graphqlRequest(ADD_TASK_DEPENDENCY_MUTATION, {
              input: {
                taskPubId: created.pubId,
                dependsOnTaskPubId: newDependencyTaskId,
                type: newDependencyType,
              },
            });
          } catch (dErr) {
            console.warn('Initial dependency error:', dErr);
          }
        }
      }

      return res;
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: `Task "${data?.createTask?.title || 'Task'}" created successfully.`,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      setNewPriority('MEDIUM');
      setSelectedAssigneePubIds([]);
      setNewComment('');
      setNewDependencyTaskId('');
      setNewDependencyType('BLOCKS');
      setNewSprintPubId('');
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
      queryClient.invalidateQueries({ queryKey: ['projectSprints', selectedProjectPubId] });
      queryClient.invalidateQueries({ queryKey: ['organizationProjects', effectiveOrgPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to create task.',
      });
    },
  });

  // Drawer: Post Comment Mutation
  const postDrawerCommentMutation = useMutation({
    mutationFn: async ({ taskPubId, content }: { taskPubId: string; content: string }) => {
      return graphqlRequest<{ createTaskComment: any }>(CREATE_TASK_COMMENT_MUTATION, {
        input: { taskPubId, content },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
      setDrawerCommentText('');
      setStatusMsg({ type: 'success', text: 'Comment posted.' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to post comment.' });
    },
  });

  // Drawer: Add Dependency Mutation
  const addDrawerDependencyMutation = useMutation({
    mutationFn: async ({
      taskPubId,
      dependsOnTaskPubId,
      type,
    }: {
      taskPubId: string;
      dependsOnTaskPubId: string;
      type: 'BLOCKS' | 'RELATES_TO';
    }) => {
      return graphqlRequest<{ addTaskDependency: any }>(ADD_TASK_DEPENDENCY_MUTATION, {
        input: { taskPubId, dependsOnTaskPubId, type },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
      setDrawerDepTaskId('');
      setStatusMsg({ type: 'success', text: 'Dependency added.' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to add dependency.' });
    },
  });

  // Drawer: Remove Dependency Mutation
  const removeDrawerDependencyMutation = useMutation({
    mutationFn: async ({
      taskPubId,
      dependsOnTaskPubId,
    }: {
      taskPubId: string;
      dependsOnTaskPubId: string;
    }) => {
      return graphqlRequest<{ removeTaskDependency: any }>(REMOVE_TASK_DEPENDENCY_MUTATION, {
        input: { taskPubId, dependsOnTaskPubId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
      setStatusMsg({ type: 'success', text: 'Dependency removed.' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to remove dependency.' });
    },
  });

  // Assign Task Mutation
  const assignTaskMutation = useMutation({
    mutationFn: async ({ taskPubId, userPubId }: { taskPubId: string; userPubId: string }) => {
      return graphqlRequest<{ assignTask: { success: boolean; message: string } }>(
        ASSIGN_TASK_MUTATION,
        { input: { taskPubId, userPubId } }
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
      const targetMember = members.find((m: any) => m.user?.pubId === variables.userPubId);
      if (targetMember && selectedTask) {
        setSelectedTask((prev: any) => {
          if (!prev) return prev;
          const currentAssignees = prev.assignees || [];
          if (currentAssignees.some((a: any) => a.user?.pubId === variables.userPubId)) return prev;
          return {
            ...prev,
            assignees: [...currentAssignees, { user: targetMember.user }],
          };
        });
      }
      setStatusMsg({
        type: 'success',
        text: data?.assignTask?.message || 'Member assigned to task.',
      });
      setAssignSelectPubId('');
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to assign member to task.',
      });
    },
  });

  // Unassign Task Mutation
  const unassignTaskMutation = useMutation({
    mutationFn: async ({ taskPubId, userPubId }: { taskPubId: string; userPubId: string }) => {
      return graphqlRequest<{ unassignTask: { success: boolean; message: string } }>(
        UNASSIGN_TASK_MUTATION,
        { input: { taskPubId, userPubId } }
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
      if (selectedTask) {
        setSelectedTask((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            assignees: (prev.assignees || []).filter(
              (a: any) => a.user?.pubId !== variables.userPubId
            ),
          };
        });
      }
      setStatusMsg({
        type: 'success',
        text: data?.unassignTask?.message || 'Member unassigned from task.',
      });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to unassign member from task.',
      });
    },
  });

  // 6. Mutation: Update Task
  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask?.pubId) return;
      return graphqlRequest<{ updateTask: any }>(UPDATE_TASK_MUTATION, {
        pubId: selectedTask.pubId,
        input: {
          title: editTitle.trim(),
          description: editDesc.trim() || undefined,
          status: editStatus,
          priority: editPriority,
          dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: `Task "${data?.updateTask?.title || editTitle}" updated.`,
      });
      setSelectedTask(null);
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to update task.',
      });
    },
  });

  // 7. Mutation: Delete Task
  const deleteTaskMutation = useMutation({
    mutationFn: async (pubId: string) => {
      return graphqlRequest<{ deleteTask: any }>(DELETE_TASK_MUTATION, { pubId });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: data?.deleteTask?.message || 'Task deleted.',
      });
      setSelectedTask(null);
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
      queryClient.invalidateQueries({ queryKey: ['organizationProjects', effectiveOrgPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to delete task.',
      });
    },
  });

  // 8. Mutation: Create Project (Fallback when workspace has 0 projects)
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ createProject: any }>(CREATE_PROJECT_MUTATION, {
        input: {
          organizationPubId: effectiveOrgPubId,
          name: newProjectName.trim(),
          key: newProjectKey.trim().toUpperCase(),
          description: newProjectDesc.trim() || undefined,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: `Project "${data?.createProject?.name || 'Project'}" created.`,
      });
      setShowCreateProjectModal(false);
      setNewProjectName('');
      setNewProjectKey('');
      setNewProjectDesc('');
      queryClient.invalidateQueries({ queryKey: ['organizationProjects', effectiveOrgPubId] });
      if (data?.createProject?.pubId) {
        setSelectedProjectPubId(data.createProject.pubId);
      }
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to create project.',
      });
    },
  });

  // --- SPRINT MUTATIONS ---

  // 9. Mutation: Create Sprint
  const createSprintMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectPubId) throw new Error('No project selected.');
      return graphqlRequest<{ createSprint: any }>(CREATE_SPRINT_MUTATION, {
        input: {
          projectPubId: selectedProjectPubId,
          name: sprintName.trim(),
          goal: sprintGoal.trim() || undefined,
          startDate: new Date(sprintStartDate).toISOString(),
          endDate: new Date(sprintEndDate).toISOString(),
          status: sprintStatus,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: `Sprint "${data?.createSprint?.name || sprintName}" created.`,
      });
      setShowCreateSprintModal(false);
      setSprintName('');
      setSprintGoal('');
      setSprintStartDate('');
      setSprintEndDate('');
      setSprintStatus('PLANNED');
      if (data?.createSprint?.pubId) {
        setSelectedSprintPubId(data.createSprint.pubId);
      }
      queryClient.invalidateQueries({ queryKey: ['projectSprints', selectedProjectPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to create sprint.' });
    },
  });

  // 10. Mutation: Update Sprint
  const updateSprintMutation = useMutation({
    mutationFn: async ({
      pubId,
      status,
      name,
      goal,
      startDate,
      endDate,
    }: {
      pubId?: string;
      status?: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
      name?: string;
      goal?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const targetPubId = pubId || selectedSprintPubId;
      if (!targetPubId) throw new Error('No sprint selected.');
      return graphqlRequest<{ updateSprint: any }>(UPDATE_SPRINT_MUTATION, {
        pubId: targetPubId,
        input: {
          name: name ? name.trim() : undefined,
          goal: goal !== undefined ? goal.trim() || undefined : undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          status,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: `Sprint "${data?.updateSprint?.name || 'Sprint'}" updated.`,
      });
      setShowEditSprintModal(false);
      queryClient.invalidateQueries({ queryKey: ['projectSprints', selectedProjectPubId] });
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to update sprint.' });
    },
  });

  // 11. Mutation: Delete Sprint
  const deleteSprintMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSprintPubId) throw new Error('No sprint selected.');
      return graphqlRequest<{ deleteSprint: any }>(DELETE_SPRINT_MUTATION, {
        pubId: selectedSprintPubId,
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: data?.deleteSprint?.message || 'Sprint deleted.',
      });
      setShowDeleteSprintModal(false);
      setSelectedSprintPubId('');
      queryClient.invalidateQueries({ queryKey: ['projectSprints', selectedProjectPubId] });
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to delete sprint.' });
    },
  });

  // 12. Mutation: Add Task to Sprint
  const addTaskToSprintMutation = useMutation({
    mutationFn: async ({ sprintPubId, taskPubId }: { sprintPubId: string; taskPubId: string }) => {
      return graphqlRequest<{ addTaskToSprint: any }>(ADD_TASK_TO_SPRINT_MUTATION, {
        input: { sprintPubId, taskPubId },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: data?.addTaskToSprint?.message || 'Task assigned to sprint.',
      });
      queryClient.invalidateQueries({ queryKey: ['projectSprints', selectedProjectPubId] });
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to assign task to sprint.' });
    },
  });

  // 13. Mutation: Remove Task from Sprint
  const removeTaskFromSprintMutation = useMutation({
    mutationFn: async ({ sprintPubId, taskPubId }: { sprintPubId: string; taskPubId: string }) => {
      return graphqlRequest<{ removeTaskFromSprint: any }>(REMOVE_TASK_FROM_SPRINT_MUTATION, {
        input: { sprintPubId, taskPubId },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: data?.removeTaskFromSprint?.message || 'Task moved back to backlog.',
      });
      queryClient.invalidateQueries({ queryKey: ['projectSprints', selectedProjectPubId] });
      queryClient.invalidateQueries({ queryKey: ['projectTasks', selectedProjectPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to remove task from sprint.' });
    },
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskPubId: string) => {
    e.dataTransfer.setData('text/plain', taskPubId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskPubId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatusType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatusType) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskPubId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskPubId) return;

    const task = tasks.find((t: any) => t.pubId === taskPubId);
    if (!task) return;

    if (task.status === targetStatus) return; // Same column

    const tasksInTarget = tasks.filter((t: any) => t.status === targetStatus);
    const newPosition = (tasksInTarget.length + 1) * 1000.0;

    // Optimistic cache update for instant visual responsiveness
    queryClient.setQueryData(['projectTasks', selectedProjectPubId], (old: any[]) => {
      if (!Array.isArray(old)) return old;
      return old.map((t) => (t.pubId === taskPubId ? { ...t, status: targetStatus, position: newPosition } : t));
    });

    // Execute backend mutation
    updateTaskPositionMutation.mutate({
      taskPubId,
      status: targetStatus,
      position: newPosition,
    });
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t: any) => {
    const titleMatch = t.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const priorityMatch = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return (titleMatch || descMatch) && priorityMatch;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-950 border-rose-800 text-rose-300 font-bold';
      case 'HIGH':
        return 'bg-amber-950 border-amber-800 text-amber-300 font-semibold';
      case 'MEDIUM':
        return 'bg-indigo-950 border-indigo-800 text-indigo-300';
      case 'LOW':
        return 'bg-slate-800 border-slate-700 text-slate-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Banner & Project Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-sm">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Task Workspace & Kanban</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Workspace:</span>
              <span className="text-indigo-300 font-semibold">{currentOrgName}</span>
              <span className="text-[11px] font-mono text-slate-500">({orgSlug})</span>
            </p>
          </div>
        </div>

        {/* Project Selector & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {projects.length > 0 && (
            <>
              {/* Project Dropdown */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <select
                  value={selectedProjectPubId}
                  onChange={(e) => {
                    setSelectedProjectPubId(e.target.value);
                    setSelectedSprintPubId('');
                  }}
                  className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-2 font-mono"
                >
                  {projects.map((p: any) => (
                    <option key={p.pubId} value={p.pubId} className="bg-slate-900 text-slate-200">
                      [{p.key}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sprint Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <select
                    value={selectedSprintPubId}
                    onChange={(e) => setSelectedSprintPubId(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-2 font-mono max-w-[190px] truncate"
                  >
                    <option value="" className="bg-slate-900 text-slate-200">
                      All Tasks ({tasks.length})
                    </option>
                    {sprints.map((s: any) => (
                      <option key={s.pubId} value={s.pubId} className="bg-slate-900 text-slate-200">
                        [{s.status}] {s.name} ({s.taskCount || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSprintName('');
                    setSprintGoal('');
                    setSprintStartDate(new Date().toISOString().slice(0, 10));
                    const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                    setSprintEndDate(twoWeeks);
                    setSprintStatus('PLANNED');
                    setShowCreateSprintModal(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  title="Plan New Sprint"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sprint</span>
                </button>
              </div>
            </>
          )}

          {/* View Mode */}
          <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md cursor-pointer transition-all duration-200 active:scale-95 ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md cursor-pointer transition-all duration-200 active:scale-95 ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {projects.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setCreateColumnTarget('TODO');
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateProjectModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project First</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 border shadow-sm ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Zero Projects Empty State */}
      {!isProjectsLoading && projects.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-dashed border-slate-800 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-base text-slate-200">No Projects in this Workspace</h3>
            <p className="text-xs text-slate-400">
              Tasks belong to projects. Create your first project in <span className="text-slate-200">{currentOrgName}</span> to start creating tasks and using the Kanban board.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateProjectModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      )}

      {/* ACTIVE SPRINT MILESTONE BANNER */}
      {activeSprint && (
        <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-100">{activeSprint.name}</h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      activeSprint.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold'
                        : activeSprint.status === 'COMPLETED'
                        ? 'bg-slate-800 border-slate-700 text-slate-400'
                        : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                    }`}
                  >
                    {activeSprint.status}
                  </span>
                </div>
                {activeSprint.goal && (
                  <p className="text-xs text-slate-400 mt-0.5">{activeSprint.goal}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {activeSprint.status === 'PLANNED' && (
                <button
                  type="button"
                  disabled={updateSprintMutation.isPending}
                  onClick={() => {
                    updateSprintMutation.mutate({
                      pubId: activeSprint.pubId,
                      status: 'ACTIVE',
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Sprint</span>
                </button>
              )}

              {activeSprint.status === 'ACTIVE' && (
                <button
                  type="button"
                  disabled={updateSprintMutation.isPending}
                  onClick={() => {
                    updateSprintMutation.mutate({
                      pubId: activeSprint.pubId,
                      status: 'COMPLETED',
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Sprint</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditSprintName(activeSprint.name);
                  setEditSprintGoal(activeSprint.goal || '');
                  setEditSprintStartDate(
                    activeSprint.startDate ? activeSprint.startDate.slice(0, 10) : ''
                  );
                  setEditSprintEndDate(
                    activeSprint.endDate ? activeSprint.endDate.slice(0, 10) : ''
                  );
                  setEditSprintStatus(activeSprint.status);
                  setShowEditSprintModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                <Edit2 className="w-3 h-3 text-slate-400" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteSprintModal(true)}
                className="p-1.5 hover:bg-rose-950/60 hover:text-rose-400 text-slate-500 rounded-lg cursor-pointer transition-colors"
                title="Delete Sprint"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sprint Progress Bar */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {new Date(activeSprint.startDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  –{' '}
                  {new Date(activeSprint.endDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </span>
              <span className="font-semibold text-slate-300">
                {sprintDoneCount} of {sprintTotalCount} tasks done ({sprintProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${sprintProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toolbar: Search & Priority Filters */}
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title or description..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto pb-1 max-w-full">
            <span className="text-[11px] text-slate-500 mr-1">Priority:</span>
            {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all duration-150 text-[11px] whitespace-nowrap ${
                  priorityFilter === p
                    ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isTasksLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-pulse h-96">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="h-20 bg-slate-950/60 rounded-lg" />
              <div className="h-20 bg-slate-950/60 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* KANBAN BOARD VIEW WITH DRAG & DROP */}
      {!isTasksLoading && projects.length > 0 && viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks
              .filter((t: any) => t.status === col.id)
              .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

            const isDropTarget = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`p-3 rounded-xl border transition-all duration-200 flex flex-col min-h-[640px] shadow-sm ${
                  isDropTarget
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-950/20'
                    : col.color
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono">
                      {col.label}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${col.badge}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCreateColumnTarget(col.id);
                      setShowCreateModal(true);
                    }}
                    title={`Add task to ${col.label}`}
                    className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Drop Area & Task List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colTasks.length === 0 ? (
                    <div className="h-32 border border-dashed border-slate-800/60 rounded-lg flex flex-col items-center justify-center p-3 text-center text-slate-500 text-[11px] select-none">
                      <span>Drag tasks here</span>
                      <span className="text-[10px] text-slate-600 mt-0.5">or click + to add</span>
                    </div>
                  ) : (
                    colTasks.map((task: any) => {
                      const isBeingDragged = draggedTaskId === task.pubId;
                      const taskKey = task.project?.key
                        ? `${task.project.key}-${task.pubId.slice(-4).toUpperCase()}`
                        : task.pubId.slice(0, 8);

                      return (
                        <div
                          key={task.pubId}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task.pubId)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedTask(task)}
                          className={`p-3.5 bg-slate-900 border rounded-xl cursor-grab active:cursor-grabbing transition-all duration-150 shadow-sm space-y-2.5 group hover:border-indigo-500/50 hover:scale-[1.01] hover:shadow-md ${
                            isBeingDragged
                              ? 'opacity-40 border-indigo-500 scale-95'
                              : 'border-slate-800/80 hover:bg-slate-850'
                          }`}
                        >
                          {/* Task Card Header */}
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                              {taskKey}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getPriorityBadge(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {/* Task Title */}
                          <h4 className="font-semibold text-xs text-slate-100 line-clamp-2 leading-snug">
                            {task.title}
                          </h4>

                          {/* Task Description */}
                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 font-sans leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Task Card Footer */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            {/* Assignee Avatars */}
                            <div className="flex items-center gap-1 min-w-0">
                              {task.assignees && task.assignees.length > 0 ? (
                                <div className="flex items-center -space-x-1.5">
                                  {task.assignees.slice(0, 3).map((a: any, idx: number) => {
                                    const u = a.user;
                                    const initials = (u?.fullName || u?.email || 'U').slice(0, 2).toUpperCase();
                                    return (
                                      <div
                                        key={u?.pubId || a.pubId || idx}
                                        title={`Assigned: ${u?.fullName || u?.email}`}
                                        className="w-5 h-5 rounded-full bg-indigo-600 border border-slate-900 text-white font-bold text-[9px] flex items-center justify-center shadow-sm"
                                      >
                                        {initials}
                                      </div>
                                    );
                                  })}
                                  {task.assignees.length > 3 && (
                                    <div
                                      title={`${task.assignees.length - 3} more assignees`}
                                      className="w-5 h-5 rounded-full bg-slate-800 border border-slate-900 text-slate-300 font-bold text-[8px] flex items-center justify-center shadow-sm"
                                    >
                                      +{task.assignees.length - 3}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 italic">
                                  <UserPlus className="w-3 h-3 text-slate-600" />
                                  <span>Unassigned</span>
                                </span>
                              )}
                            </div>

                            {/* Indicators: Comments, Dependencies, Due Date */}
                            <div className="flex items-center gap-2 text-[10px] font-mono ml-auto">
                              {task.dependencies && task.dependencies.length > 0 && (
                                <span className="flex items-center gap-0.5 text-amber-400/90" title={`${task.dependencies.length} dependencies`}>
                                  <Link2 className="w-3 h-3" />
                                  <span>{task.dependencies.length}</span>
                                </span>
                              )}
                              {task.comments && task.comments.length > 0 && (
                                <span className="flex items-center gap-0.5 text-slate-400" title={`${task.comments.length} comments`}>
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{task.comments.length}</span>
                                </span>
                              )}
                              {task.dueDate ? (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                              ) : (
                                <div className="text-slate-600 text-[9px]">
                                  <span>{task.creator?.fullName?.split(' ')[0] || 'Member'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {!isTasksLoading && projects.length > 0 && viewMode === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Key</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Assignees</th>
                <th className="p-3.5">Project</th>
                <th className="p-3.5">Creator</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 text-xs font-sans">
                    No tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t: any) => {
                  const taskKey = t.project?.key
                    ? `${t.project.key}-${t.pubId.slice(-4).toUpperCase()}`
                    : t.pubId.slice(0, 8);

                  return (
                    <tr
                      key={t.pubId}
                      onClick={() => setSelectedTask(t)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 text-indigo-400 font-bold">{taskKey}</td>
                      <td className="p-3.5 font-semibold text-slate-100 font-sans">{t.title}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 text-[10px] border border-slate-800">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3.5 font-sans">
                        {t.assignees && t.assignees.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {t.assignees.map((a: any, idx: number) => {
                              const u = a.user;
                              const initials = (u?.fullName || u?.email || 'U').slice(0, 2).toUpperCase();
                              return (
                                <span
                                  key={u?.pubId || a.pubId || idx}
                                  title={u?.fullName || u?.email}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono"
                                >
                                  <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center">
                                    {initials}
                                  </span>
                                  <span className="truncate max-w-[70px]">{u?.fullName || u?.email?.split('@')[0]}</span>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300 font-sans">{t.project?.name || 'Project'}</td>
                      <td className="p-3.5 text-slate-400 font-sans">
                        {t.creator?.fullName || t.creator?.email || 'N/A'}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(t);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT / DETAILS DRAWER */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-5 font-sans text-slate-100 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {selectedTask.project?.key
                      ? `${selectedTask.project.key}-${selectedTask.pubId.slice(-4).toUpperCase()}`
                      : selectedTask.pubId.slice(0, 8)}
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-xs text-slate-400 font-mono">
                    Project: {selectedTask.project?.name || activeProject?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Task Edit Form */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                  />
                </div>

                {/* Status Column Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Status Column (Move position)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {COLUMNS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEditStatus(c.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                          editStatus === c.id
                            ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority & Due Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TaskPriorityType)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                    <CalendarDatePicker
                      value={editDueDate}
                      onChange={setEditDueDate}
                      placeholder="Set due date..."
                    />
                  </div>
                </div>

                {/* Task Sprint Milestone Section */}
                {(() => {
                  const currentTaskSprint = sprints.find((s: any) =>
                    (s.tasks || []).some((st: any) => st.pubId === selectedTask.pubId)
                  );

                  return (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Sprint Milestone</span>
                        </label>
                        {currentTaskSprint && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                            {currentTaskSprint.status}
                          </span>
                        )}
                      </div>

                      {currentTaskSprint ? (
                        <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-100 truncate">{currentTaskSprint.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {new Date(currentTaskSprint.startDate).toLocaleDateString()} –{' '}
                              {new Date(currentTaskSprint.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={removeTaskFromSprintMutation.isPending}
                            onClick={() => {
                              removeTaskFromSprintMutation.mutate({
                                sprintPubId: currentTaskSprint.pubId,
                                taskPubId: selectedTask.pubId,
                              });
                            }}
                            className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded border border-slate-700 hover:border-rose-800 cursor-pointer transition-colors"
                          >
                            Move to Backlog
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={drawerSprintSelectPubId}
                            onChange={(e) => setDrawerSprintSelectPubId(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                          >
                            <option value="">Select sprint to assign...</option>
                            {sprints.map((s: any) => (
                              <option key={s.pubId} value={s.pubId}>
                                [{s.status}] {s.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!drawerSprintSelectPubId || addTaskToSprintMutation.isPending}
                            onClick={() => {
                              if (drawerSprintSelectPubId) {
                                addTaskToSprintMutation.mutate({
                                  sprintPubId: drawerSprintSelectPubId,
                                  taskPubId: selectedTask.pubId,
                                });
                                setDrawerSprintSelectPubId('');
                              }
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shadow-sm"
                          >
                            Assign
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Task Assignees Section */}
                {(() => {
                  const currentAssigneePubIds = (selectedTask.assignees || [])
                    .map((a: any) => a.user?.pubId)
                    .filter(Boolean);
                  const availableMembersToAssign = members.filter(
                    (m: any) => m.user?.pubId && !currentAssigneePubIds.includes(m.user.pubId)
                  );

                  return (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Assigned Members</span>
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">
                          {(selectedTask.assignees || []).length} assigned
                        </span>
                      </div>

                      {/* Current Assignees List */}
                      <div className="space-y-1.5">
                        {(selectedTask.assignees || []).length === 0 ? (
                          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-500 italic flex items-center gap-2">
                            <UserPlus className="w-3.5 h-3.5 text-slate-600" />
                            <span>No members assigned yet. Assign a team member below.</span>
                          </div>
                        ) : (
                          (selectedTask.assignees || []).map((a: any, idx: number) => {
                            const u = a.user;
                            const initials = (u?.fullName || u?.email || 'U').slice(0, 2).toUpperCase();
                            return (
                              <div
                                key={u?.pubId || a.pubId || idx}
                                className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-200 text-xs truncate">
                                      {u?.fullName || u?.email?.split('@')[0]}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-mono truncate">{u?.email}</p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  title="Remove Assignee"
                                  disabled={unassignTaskMutation.isPending}
                                  onClick={() => {
                                    if (u?.pubId) {
                                      unassignTaskMutation.mutate({ taskPubId: selectedTask.pubId, userPubId: u.pubId });
                                    }
                                  }}
                                  className="p-1 hover:bg-rose-950 hover:text-rose-400 text-slate-500 rounded cursor-pointer transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Assign Member Dropdown */}
                      {availableMembersToAssign.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <select
                            value={assignSelectPubId}
                            onChange={(e) => setAssignSelectPubId(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                          >
                            <option value="">Select member to assign...</option>
                            {availableMembersToAssign.map((m: any) => (
                              <option key={m.user?.pubId} value={m.user?.pubId}>
                                {m.user?.fullName || m.user?.email} ({m.role})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!assignSelectPubId || assignTaskMutation.isPending}
                            onClick={() => {
                              if (assignSelectPubId) {
                                assignTaskMutation.mutate({ taskPubId: selectedTask.pubId, userPubId: assignSelectPubId });
                              }
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                          >
                            {assignTaskMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserPlus className="w-3 h-3" />
                            )}
                            <span>Assign</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Task Dependencies Section */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Task Dependencies</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">
                      {(selectedTask.dependencies || []).length} linked
                    </span>
                  </div>

                  {/* List of dependencies */}
                  <div className="space-y-1.5">
                    {(selectedTask.dependencies || []).length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic px-2.5 py-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        No dependencies. This task can be worked on independently.
                      </p>
                    ) : (
                      (selectedTask.dependencies || []).map((dep: any) => {
                        const targetTask = tasks.find((t: any) => t.pubId === dep.dependsOnTaskPubId);
                        const targetKey = targetTask?.project?.key
                          ? `${targetTask.project.key}-${targetTask.pubId.slice(-4).toUpperCase()}`
                          : dep.dependsOnTaskPubId?.slice(0, 8);

                        return (
                          <div
                            key={dep.pubId || dep.dependsOnTaskPubId}
                            className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-bold">
                                {dep.type || 'BLOCKS'}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-200 text-xs truncate">
                                  [{targetKey}] {targetTask?.title || 'Linked Task'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono truncate">
                                  Status: {targetTask?.status || 'Active'}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              title="Remove Dependency"
                              disabled={removeDrawerDependencyMutation.isPending}
                              onClick={() => {
                                removeDrawerDependencyMutation.mutate({
                                  taskPubId: selectedTask.pubId,
                                  dependsOnTaskPubId: dep.dependsOnTaskPubId,
                                });
                              }}
                              className="p-1 hover:bg-rose-950 hover:text-rose-400 text-slate-500 rounded cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Dependency Controls */}
                  {(() => {
                    const existingDepIds = (selectedTask.dependencies || []).map((d: any) => d.dependsOnTaskPubId);
                    const availableTasks = tasks.filter(
                      (t: any) => t.pubId !== selectedTask.pubId && !existingDepIds.includes(t.pubId)
                    );

                    if (availableTasks.length === 0) return null;

                    return (
                      <div className="flex items-center gap-2 pt-1">
                        <select
                          value={drawerDepTaskId}
                          onChange={(e) => setDrawerDepTaskId(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                        >
                          <option value="">Select task to depend on...</option>
                          {availableTasks.map((t: any) => {
                            const taskKey = t.project?.key
                              ? `${t.project.key}-${t.pubId.slice(-4).toUpperCase()}`
                              : t.pubId.slice(0, 8);
                            return (
                              <option key={t.pubId} value={t.pubId}>
                                [{taskKey}] {t.title}
                              </option>
                            );
                          })}
                        </select>
                        <select
                          value={drawerDepType}
                          onChange={(e) => setDrawerDepType(e.target.value as 'BLOCKS' | 'RELATES_TO')}
                          className="w-24 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="BLOCKS">BLOCKS</option>
                          <option value="RELATES_TO">RELATES</option>
                        </select>
                        <button
                          type="button"
                          disabled={!drawerDepTaskId || addDrawerDependencyMutation.isPending}
                          onClick={() => {
                            if (drawerDepTaskId) {
                              addDrawerDependencyMutation.mutate({
                                taskPubId: selectedTask.pubId,
                                dependsOnTaskPubId: drawerDepTaskId,
                                type: drawerDepType,
                              });
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                        >
                          {addDrawerDependencyMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Link2 className="w-3 h-3" />
                          )}
                          <span>Link</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Task Comments Section */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Comments & Activity</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">
                      {(selectedTask.comments || []).length} comments
                    </span>
                  </div>

                  {/* List of comments */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(selectedTask.comments || []).length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic px-2.5 py-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        No comments yet. Start the discussion below.
                      </p>
                    ) : (
                      (selectedTask.comments || []).map((cm: any) => (
                        <div
                          key={cm.pubId}
                          className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">
                              {cm.author?.fullName || cm.author?.email?.split('@')[0] || 'Member'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {cm.createdAt ? new Date(cm.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                            {cm.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* New Comment Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={drawerCommentText}
                      onChange={(e) => setDrawerCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && drawerCommentText.trim() && !postDrawerCommentMutation.isPending) {
                          e.preventDefault();
                          postDrawerCommentMutation.mutate({
                            taskPubId: selectedTask.pubId,
                            content: drawerCommentText.trim(),
                          });
                        }
                      }}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                    <button
                      type="button"
                      disabled={!drawerCommentText.trim() || postDrawerCommentMutation.isPending}
                      onClick={() => {
                        if (drawerCommentText.trim()) {
                          postDrawerCommentMutation.mutate({
                            taskPubId: selectedTask.pubId,
                            content: drawerCommentText.trim(),
                          });
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                    >
                      {postDrawerCommentMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>Comment</span>
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                  <p>Created: {new Date(selectedTask.createdAt).toLocaleString()}</p>
                  <p>Creator: {selectedTask.creator?.fullName || selectedTask.creator?.email || 'N/A'}</p>
                  <p>PubId: {selectedTask.pubId}</p>
                </div>
              </div>
            </div>

            {/* Actions: Save & Delete */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete task "${selectedTask.title}"?`)) {
                    deleteTaskMutation.mutate(selectedTask.pubId);
                  }
                }}
                disabled={deleteTaskMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                {deleteTaskMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Task</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => updateTaskMutation.mutate()}
                  disabled={updateTaskMutation.isPending || !editTitle.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  {updateTaskMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Create New Task</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTaskMutation.mutate();
              }}
              className="space-y-3.5 text-xs font-sans"
            >
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Project <span className="text-indigo-400">*</span>
                </label>
                <select
                  value={selectedProjectPubId}
                  onChange={(e) => setSelectedProjectPubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                >
                  {projects.map((p: any) => (
                    <option key={p.pubId} value={p.pubId}>
                      [{p.key}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Task Title <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement authentication middleware"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Acceptance criteria and implementation details..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Initial Column</label>
                  <select
                    value={createColumnTarget}
                    onChange={(e) => setCreateColumnTarget(e.target.value as TaskStatusType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriorityType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Due Date (Optional)</label>
                <CalendarDatePicker
                  value={newDueDate}
                  onChange={setNewDueDate}
                  placeholder="Select due date from calendar..."
                />
              </div>

              {/* Sprint Milestone (Optional) */}
              <div>
                <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sprint Milestone (Optional)</span>
                </label>
                <select
                  value={newSprintPubId}
                  onChange={(e) => setNewSprintPubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                >
                  <option value="">No Sprint (Project Backlog)</option>
                  {sprints.map((s: any) => (
                    <option key={s.pubId} value={s.pubId}>
                      [{s.status}] {s.name} ({new Date(s.startDate).toLocaleDateString()} –{' '}
                      {new Date(s.endDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignees Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Assign Team Members (Optional)</span>
                  </label>
                  {user?.pubId && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedAssigneePubIds.includes(user.pubId)) {
                          setSelectedAssigneePubIds((prev) => prev.filter((id) => id !== user.pubId));
                        } else {
                          setSelectedAssigneePubIds((prev) => [...prev, user.pubId]);
                        }
                      }}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer transition-colors border ${
                        selectedAssigneePubIds.includes(user.pubId)
                          ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {selectedAssigneePubIds.includes(user.pubId) ? 'Assigned to You ✓' : '+ Assign to Me'}
                    </button>
                  )}
                </div>

                <div className="space-y-1 max-h-36 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-lg">
                  {members.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No organization members found.</p>
                  ) : (
                    members.map((m: any) => {
                      const u = m.user;
                      if (!u) return null;
                      const isSelected = selectedAssigneePubIds.includes(u.pubId);
                      const initials = (u.fullName || u.email || 'U').slice(0, 2).toUpperCase();

                      return (
                        <div
                          key={u.pubId}
                          onClick={() => {
                            setSelectedAssigneePubIds((prev) =>
                              isSelected ? prev.filter((id) => id !== u.pubId) : [...prev, u.pubId]
                            );
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-950/80 border border-indigo-500/50 text-indigo-200'
                              : 'hover:bg-slate-900 border border-transparent text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {initials}
                            </div>
                            <span className="text-xs truncate">{u.fullName || u.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-500">{m.role}</span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Task Dependency (Optional) */}
              <div className="space-y-1.5">
                <label className="block font-medium text-slate-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Task Dependency (Optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={newDependencyTaskId}
                      onChange={(e) => setNewDependencyTaskId(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                    >
                      <option value="">No Dependency (Independent)</option>
                      {tasks.map((t: any) => {
                        const taskKey = t.project?.key
                          ? `${t.project.key}-${t.pubId.slice(-4).toUpperCase()}`
                          : t.pubId.slice(0, 8);
                        return (
                          <option key={t.pubId} value={t.pubId}>
                            [{taskKey}] {t.title}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <select
                      value={newDependencyType}
                      disabled={!newDependencyTaskId}
                      onChange={(e) => setNewDependencyType(e.target.value as 'BLOCKS' | 'RELATES_TO')}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 disabled:opacity-40 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                    >
                      <option value="BLOCKS">BLOCKS</option>
                      <option value="RELATES_TO">RELATES</option>
                    </select>
                  </div>
                </div>
                {newDependencyTaskId && (
                  <p className="text-[10px] text-amber-300/80 font-mono">
                    This task will be marked as dependent with type: {newDependencyType}.
                  </p>
                )}
              </div>

              {/* Initial Task Comment (Optional) */}
              <div>
                <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Initial Comment / Kickoff Note (Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add kickoff instructions, context, or notes for the team..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending || !newTitle.trim()}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {createTaskMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK CREATE PROJECT MODAL */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <span>Create Project</span>
              </h3>
              <button
                onClick={() => setShowCreateProjectModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProjectMutation.mutate();
              }}
              className="space-y-3.5 text-xs font-sans"
            >
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Project Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => {
                    setNewProjectName(e.target.value);
                    if (!newProjectKey) {
                      setNewProjectKey(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase());
                    }
                  }}
                  placeholder="e.g. Core API Service"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Project Key (Prefix for tasks) <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={newProjectKey}
                  onChange={(e) => setNewProjectKey(e.target.value.toUpperCase())}
                  placeholder="e.g. CORE"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Project goals and deliverables..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending || !newProjectName.trim() || !newProjectKey.trim()}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {createProjectMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SPRINT MODAL */}
      {showCreateSprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Plan New Sprint</span>
              </h3>
              <button
                onClick={() => setShowCreateSprintModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSprintMutation.mutate();
              }}
              className="space-y-3.5 text-xs font-sans"
            >
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Sprint Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  placeholder="e.g. Sprint 1 - Core MVP"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Sprint Goal (Optional)</label>
                <textarea
                  rows={2}
                  value={sprintGoal}
                  onChange={(e) => setSprintGoal(e.target.value)}
                  placeholder="What is the key milestone or deliverable for this sprint?"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Start Date *</label>
                  <CalendarDatePicker
                    value={sprintStartDate}
                    onChange={setSprintStartDate}
                    placeholder="Select start date..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">End Date *</label>
                  <CalendarDatePicker
                    value={sprintEndDate}
                    onChange={setSprintEndDate}
                    placeholder="Select end date..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Initial Status</label>
                <select
                  value={sprintStatus}
                  onChange={(e) => setSprintStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                >
                  <option value="PLANNED">PLANNED (Upcoming)</option>
                  <option value="ACTIVE">ACTIVE (In Progress)</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateSprintModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createSprintMutation.isPending ||
                    !sprintName.trim() ||
                    !sprintStartDate ||
                    !sprintEndDate
                  }
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {createSprintMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Sprint</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SPRINT MODAL */}
      {showEditSprintModal && activeSprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <span>Edit Sprint Details</span>
              </h3>
              <button
                onClick={() => setShowEditSprintModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSprintMutation.mutate({
                  pubId: activeSprint.pubId,
                  name: editSprintName,
                  goal: editSprintGoal,
                  startDate: editSprintStartDate,
                  endDate: editSprintEndDate,
                  status: editSprintStatus,
                });
              }}
              className="space-y-3.5 text-xs font-sans"
            >
              <div>
                <label className="block font-medium text-slate-300 mb-1">Sprint Name *</label>
                <input
                  type="text"
                  required
                  value={editSprintName}
                  onChange={(e) => setEditSprintName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Sprint Goal</label>
                <textarea
                  rows={2}
                  value={editSprintGoal}
                  onChange={(e) => setEditSprintGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Start Date</label>
                  <CalendarDatePicker
                    value={editSprintStartDate}
                    onChange={setEditSprintStartDate}
                    placeholder="Start date..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">End Date</label>
                  <CalendarDatePicker
                    value={editSprintEndDate}
                    onChange={setEditSprintEndDate}
                    placeholder="End date..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Sprint Status</label>
                <select
                  value={editSprintStatus}
                  onChange={(e) => setEditSprintStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                >
                  <option value="PLANNED">PLANNED</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditSprintModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateSprintMutation.isPending || !editSprintName.trim()}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {updateSprintMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE SPRINT CONFIRMATION MODAL */}
      {showDeleteSprintModal && activeSprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-900/50 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-950/80 rounded-xl border border-rose-800/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Delete Sprint</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete sprint{' '}
              <span className="font-bold text-white">"{activeSprint.name}"</span>?
              Tasks currently assigned to this sprint will safely return to the general project backlog.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteSprintModal(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSprintMutation.isPending}
                onClick={() => deleteSprintMutation.mutate()}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                {deleteSprintMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Sprint</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
