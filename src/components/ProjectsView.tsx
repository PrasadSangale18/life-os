import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { PILLARS } from '../theme/tokens';
import type { Item } from '../types';
import { 
  Target, 
  FolderKanban, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Edit3, 
  Trash2, 
  Flame, 
  Brain, 
  Heart, 
  Star, 
  TrendingUp
} from 'lucide-react';

interface ProjectsViewProps {
  onEditTask: (item: Item) => void;
  onNewGoal: () => void;
  onNewProject: (goalId?: string) => void;
  onNewTaskInProject: (projectId: string, pillar?: string) => void;
}

const PILLAR_ICONS: Record<string, any> = {
  physical: Flame,
  mental: Brain,
  relational: Heart,
  spiritual: Star,
  financial: TrendingUp,
};

export const ProjectsView = ({ 
  onEditTask, 
  onNewGoal, 
  onNewProject, 
  onNewTaskInProject 
}: ProjectsViewProps) => {
  const items = useStore(state => state.items);
  const showPrivate = useStore(state => state.showPrivate);
  const toggleTaskStatus = useStore(state => state.toggleTaskStatus);
  const trashItem = useStore(state => state.trashItem);

  const [filterPillar, setFilterPillar] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeItems = useMemo(() => {
    return items.filter(i => !i.deletedAt && !i.isArchived && (showPrivate || !i.isPrivate));
  }, [items, showPrivate]);

  const goals = useMemo(() => {
    return activeItems.filter(i => i.type === 'goal');
  }, [activeItems]);

  const projects = useMemo(() => {
    return activeItems.filter(i => i.type === 'project');
  }, [activeItems]);

  const tasks = useMemo(() => {
    return activeItems.filter(i => i.type === 'task');
  }, [activeItems]);

  // Map tasks to project (by projectId matching project.id or project.title)
  const tasksByProject = useMemo(() => {
    const map = new Map<string, Item[]>();
    projects.forEach(p => map.set(p.id, []));

    tasks.forEach(t => {
      if (!t.projectId) return;
      // Match by ID
      if (map.has(t.projectId)) {
        map.get(t.projectId)!.push(t);
        return;
      }
      // Match by Title (backward-compatibility for legacy string tags)
      const matchingProj = projects.find(p => p.title.toLowerCase() === t.projectId?.toLowerCase());
      if (matchingProj) {
        map.get(matchingProj.id)?.push(t);
      }
    });
    return map;
  }, [projects, tasks]);

  // Overall metric stats
  const stats = useMemo(() => {
    let totalTasksInProjects = 0;
    let completedTasksInProjects = 0;

    projects.forEach(p => {
      const pTasks = tasksByProject.get(p.id) || [];
      totalTasksInProjects += pTasks.length;
      completedTasksInProjects += pTasks.filter(t => t.status === 'done').length;
    });

    const completionRate = totalTasksInProjects > 0 
      ? Math.round((completedTasksInProjects / totalTasksInProjects) * 100) 
      : 0;

    return {
      totalGoals: goals.length,
      totalProjects: projects.length,
      totalTasks: totalTasksInProjects,
      completedTasks: completedTasksInProjects,
      completionRate
    };
  }, [goals, projects, tasksByProject]);

  // Filtered lists
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (filterPillar !== 'all' && p.pillar !== filterPillar) return false;
      const pTasks = tasksByProject.get(p.id) || [];
      const isCompleted = p.status === 'done' || (pTasks.length > 0 && pTasks.every(t => t.status === 'done'));
      if (filterStatus === 'active' && isCompleted) return false;
      if (filterStatus === 'completed' && !isCompleted) return false;
      return true;
    });
  }, [projects, filterPillar, filterStatus, tasksByProject]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header bar */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "16px 20px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          flexWrap: "wrap", 
          gap: 12,
          background: "var(--bg-surface)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245,158,11,0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FolderKanban size={16} />
          </div>
          <div>
            <div className="card-title" style={{ fontSize: 16 }}>Goals & Projects</div>
            <div className="text-secondary" style={{ fontSize: 12 }}>
              Hierarchical milestone tracking: Pillars → Goals → Projects → Actionable Tasks.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button 
            onClick={onNewGoal} 
            className="btn-secondary" 
            style={{ gap: 6, fontSize: 12, padding: "7px 12px" }}
          >
            <Target size={13} color="#f59e0b" />
            <span>New Goal</span>
          </button>
          <button 
            onClick={() => onNewProject()} 
            className="btn-primary" 
            style={{ gap: 6, fontSize: 12, padding: "7px 14px" }}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Progress & Overview summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <div className="glass-panel" style={{ padding: "14px 16px" }}>
          <div className="text-meta" style={{ fontSize: 11 }}>Active Goals</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
            {stats.totalGoals}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: "14px 16px" }}>
          <div className="text-meta" style={{ fontSize: 11 }}>Active Projects</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6", marginTop: 4 }}>
            {stats.totalProjects}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: "14px 16px" }}>
          <div className="text-meta" style={{ fontSize: 11 }}>Execution Rate</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981", marginTop: 4 }}>
            {stats.completionRate}%
          </div>
          <div className="text-meta" style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>
            {stats.completedTasks} of {stats.totalTasks} child tasks done
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "10px 16px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          flexWrap: "wrap", 
          gap: 10,
          background: "var(--bg-surface)"
        }}
      >
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          <button 
            onClick={() => setFilterPillar('all')}
            className={`btn-ghost ${filterPillar === 'all' ? 'active' : ''}`}
            style={{ 
              fontSize: 12, 
              padding: "4px 10px", 
              borderRadius: 6, 
              background: filterPillar === 'all' ? "rgba(255,255,255,0.1)" : "transparent",
              color: filterPillar === 'all' ? "#fff" : "var(--text-secondary)"
            }}
          >
            All Pillars
          </button>
          {PILLARS.map(p => {
            const Icon = PILLAR_ICONS[p.id] || Flame;
            const isSel = filterPillar === p.id;
            return (
              <button 
                key={p.id}
                onClick={() => setFilterPillar(p.id)}
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 5, 
                  fontSize: 12, 
                  padding: "4px 10px", 
                  borderRadius: 6, 
                  background: isSel ? p.bg : "transparent",
                  color: isSel ? p.color : "var(--text-secondary)",
                  border: `1px solid ${isSel ? p.border : "transparent"}`,
                  cursor: "pointer"
                }}
              >
                <Icon size={12} />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {(['all', 'active', 'completed'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className="btn-ghost"
              style={{
                fontSize: 11.5,
                textTransform: 'capitalize',
                padding: "3px 8px",
                borderRadius: 5,
                background: filterStatus === st ? "rgba(255,255,255,0.08)" : "transparent",
                color: filterStatus === st ? "var(--text-primary)" : "var(--text-tertiary)"
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredProjects.map(project => {
          const pTasks = tasksByProject.get(project.id) || [];
          const doneTasks = pTasks.filter(t => t.status === 'done').length;
          const pct = pTasks.length > 0 ? Math.round((doneTasks / pTasks.length) * 100) : 0;
          const isExpanded = !!expandedProjects[project.id];
          const pillarObj = PILLARS.find(p => p.id === project.pillar);
          const parentGoal = goals.find(g => g.id === project.goalId || g.title === project.goalId);

          return (
            <div 
              key={project.id}
              className="glass-panel"
              style={{
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                borderRadius: 10,
                border: `1px solid ${pillarObj ? pillarObj.border : "var(--border-default)"}`,
                background: "rgba(16, 19, 28, 0.75)"
              }}
            >
              {/* Project Card Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
                  <button 
                    onClick={() => toggleExpand(project.id)}
                    className="btn-ghost"
                    style={{ padding: 4, borderRadius: 4, marginTop: 1, color: "var(--text-secondary)" }}
                    title={isExpanded ? "Collapse tasks" : "Expand tasks"}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                        {project.title}
                      </span>
                      {pillarObj && (
                        <span 
                          className="ui-pill" 
                          style={{ 
                            fontSize: 10, 
                            color: pillarObj.color, 
                            borderColor: pillarObj.border, 
                            background: pillarObj.bg 
                          }}
                        >
                          {pillarObj.name}
                        </span>
                      )}
                      {parentGoal && (
                        <span 
                          className="ui-pill" 
                          style={{ 
                            fontSize: 10, 
                            color: "#f59e0b", 
                            borderColor: "rgba(245,158,11,0.3)", 
                            background: "rgba(245,158,11,0.08)",
                            gap: 4
                          }}
                        >
                          <Target size={10} />
                          <span>Goal: {parentGoal.title}</span>
                        </span>
                      )}
                    </div>
                    {project.body && (
                      <div className="text-secondary" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.45 }}>
                        {project.body}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => onEditTask(project)}
                    className="btn-ghost"
                    style={{ padding: 5, borderRadius: 5, color: "var(--text-secondary)" }}
                    title="Edit project"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => trashItem(project.id)}
                    className="btn-ghost"
                    style={{ padding: 5, borderRadius: 5, color: "var(--text-secondary)" }}
                    title="Move project to trash"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span className="text-meta" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    Progress ({doneTasks}/{pTasks.length} tasks)
                  </span>
                  <span className="tabular-nums" style={{ fontSize: 11, fontWeight: 600, color: pct === 100 ? "#10b981" : "var(--text-primary)" }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 9999, overflow: "hidden" }}>
                  <div 
                    style={{ 
                      height: "100%", 
                      width: `${pct}%`, 
                      background: pct === 100 ? "#10b981" : "linear-gradient(90deg, #3b82f6, #10b981)", 
                      borderRadius: 9999, 
                      transition: "width 0.3s ease" 
                    }} 
                  />
                </div>
              </div>

              {/* Expanded Child Task List */}
              {isExpanded && (
                <div style={{ marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 6 }}>
                  {pTasks.map(task => {
                    const isDone = task.status === 'done';
                    return (
                      <div 
                        key={task.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: isDone ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.03)",
                          border: "1px solid var(--border-subtle)",
                          gap: 10
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                          <button
                            onClick={() => toggleTaskStatus(task.id)}
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              border: `1.5px solid ${isDone ? "#10b981" : "var(--border-strong)"}`,
                              background: isDone ? "#10b981" : "transparent",
                              color: "#000",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                              flexShrink: 0
                            }}
                          >
                            {isDone && <Check size={11} strokeWidth={3} />}
                          </button>
                          <span 
                            style={{ 
                              fontSize: 13, 
                              color: isDone ? "var(--text-muted)" : "var(--text-primary)",
                              textDecoration: isDone ? "line-through" : "none"
                            }}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button
                            onClick={() => onEditTask(task)}
                            className="btn-ghost"
                            style={{ padding: 4, borderRadius: 4, color: "var(--text-secondary)" }}
                            title="Edit task"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 4 }}>
                    <button
                      onClick={() => onNewTaskInProject(project.id, project.pillar)}
                      className="btn-ghost"
                      style={{ fontSize: 12, gap: 5, color: "var(--accent-hover)", padding: "4px 8px" }}
                    >
                      <Plus size={13} />
                      <span>Add Task to this project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="glass-panel" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-tertiary)", fontSize: 13 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(245,158,11,0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <FolderKanban size={20} />
            </div>
            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
              No Projects Found
            </div>
            <p style={{ maxWidth: 360, margin: "0 auto 14px", lineHeight: 1.5 }}>
              Group related tasks into a Project and align them with your Life Pillars and long-term Goals.
            </p>
            <button onClick={() => onNewProject()} className="btn-primary" style={{ padding: "8px 16px" }}>
              Create Your First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
