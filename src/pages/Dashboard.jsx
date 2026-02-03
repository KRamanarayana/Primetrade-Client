import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { useDebounce } from '@/hooks/useDebounce';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [taskLoading, setTaskLoading] = useState(true);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [filter, setFilter] = useState('all'); // all, completed, pending

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTasks, setTotalTasks] = useState(0);
    const limit = 10;

    // New Task State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [addingTask, setAddingTask] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    // Delete and Toggle State
    const [deletingId, setDeletingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

    // Menu state
    const [openMenuId, setOpenMenuId] = useState(null);

    // Delete confirmation modal state
    const [deleteConfirmTask, setDeleteConfirmTask] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && !event.target.closest('.menu-container')) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    const fetchTasks = async () => {
        setTaskLoading(true);
        try {
            const { data } = await api.get(`/tasks?search=${debouncedSearch}&filter=${filter === 'all' ? '' : filter}&page=${currentPage}&limit=${limit}`);
            setTasks(data.tasks);
            setTotalPages(data.totalPages);
            setTotalTasks(data.totalTasks);
        } catch (err) {
            console.error(err);
        } finally {
            setTaskLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user, debouncedSearch, filter, currentPage]);

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, filter]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        setAddingTask(true);
        try {
            const { data } = await api.post('/tasks', { title, description });
            setTasks([data, ...tasks]);
            setTitle('');
            setDescription('');
        } catch (err) {
            alert('Failed to add task');
        } finally {
            setAddingTask(false);
        }
    };

    const handleToggle = async (task) => {
        setTogglingId(task._id);
        try {
            const { data } = await api.put(`/tasks/${task._id}`, { isCompleted: !task.isCompleted });
            setTasks(tasks.map(t => t._id === task._id ? data : t));
        } catch (err) {
            alert('Failed to update task');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = (task) => {
        setDeleteConfirmTask(task);
        setOpenMenuId(null);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmTask) return;
        setDeletingId(deleteConfirmTask._id);
        try {
            await api.delete(`/tasks/${deleteConfirmTask._id}`);
            const updatedTasks = tasks.filter(t => t._id !== deleteConfirmTask._id);
            setTasks(updatedTasks);

            // If we deleted the last item on this page and we're not on page 1, go to previous page
            if (updatedTasks.length === 0 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (err) {
            alert('Failed to delete task');
        } finally {
            setDeletingId(null);
            setDeleteConfirmTask(null);
        }
    };

    const startEdit = (task) => {
        setEditingId(task._id);
        setEditTitle(task.title);
        setEditDescription(task.description);
    };

    const saveEdit = async () => {
        setSavingEdit(true);
        try {
            const { data } = await api.put(`/tasks/${editingId}`, { title: editTitle, description: editDescription });
            setTasks(tasks.map(t => t._id === editingId ? data : t));
            setEditingId(null);
        } catch (err) {
            alert('Failed to update task');
        } finally {
            setSavingEdit(false);
        }
    };

    if (authLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Task Dashboard</h1>

                {/* Add Task Form */}
                <div className="bg-white p-6 rounded-lg shadow mb-8">
                    <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
                    <form onSubmit={handleAddTask} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Task Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <textarea
                                placeholder="Task Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={addingTask}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {addingTask ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Add Task
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Search and Filter */}
                <div className="bg-white p-6 rounded-lg shadow mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Tasks</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Your Tasks</h2>
                    <div className="space-y-4">
                        {taskLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                No tasks found. Add your first task above!
                            </div>
                        ) : (
                            tasks.map(task => (
                                <div key={task._id} className={`bg-white p-4 rounded-lg shadow border-l-4 ${task.isCompleted ? 'border-green-500' : 'border-yellow-500'} ${(deletingId === task._id || togglingId === task._id) ? 'opacity-50' : ''}`}>
                                    {editingId === task._id ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <textarea
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="2"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={saveEdit}
                                                    disabled={savingEdit}
                                                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {savingEdit ? (
                                                        <>
                                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    disabled={savingEdit}
                                                    className="text-sm bg-gray-300 px-3 py-1 rounded hover:bg-gray-400 disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex-1 w-full">
                                                <h4 className={`text-lg font-semibold ${task.isCompleted ? 'line-through text-gray-400' : ''}`}>{task.title}</h4>
                                                <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                                                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${task.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {task.isCompleted ? 'Completed' : 'Pending'}
                                                </span>
                                            </div>

                                            {/* Three-dot menu */}
                                            <div className="relative menu-container">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === task._id ? null : task._id);
                                                    }}
                                                    disabled={deletingId === task._id || togglingId === task._id}
                                                    className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                                    </svg>
                                                </button>

                                                {/* Dropdown menu */}
                                                {openMenuId === task._id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                                        <div className="py-1">
                                                            {/* Mark Complete/Pending */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggle(task);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                disabled={togglingId === task._id}
                                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 ${task.isCompleted ? 'text-yellow-600' : 'text-green-600'}`}
                                                            >
                                                                {togglingId === task._id ? (
                                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                ) : task.isCompleted ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                )}
                                                                {task.isCompleted ? 'Mark Pending' : 'Mark Complete'}
                                                            </button>

                                                            {/* Edit */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEdit(task);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                disabled={togglingId === task._id || deletingId === task._id}
                                                                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                </svg>
                                                                Edit
                                                            </button>

                                                            {/* Delete */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(task);
                                                                }}
                                                                disabled={deletingId === task._id}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                {deletingId === task._id ? (
                                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                    </svg>
                                                                )}
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{tasks.length > 0 ? ((currentPage - 1) * limit) + 1 : 0}</span> to{' '}
                                <span className="font-medium">{Math.min(currentPage * limit, totalTasks)}</span> of{' '}
                                <span className="font-medium">{totalTasks}</span> tasks
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                {/* Page numbers */}
                                <div className="hidden sm:flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                        // Show first page, last page, current page, and pages around current
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return <span key={page} className="px-2 py-2 text-gray-500">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDeleteConfirmTask(null)}>
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-700 mb-2">Are you sure you want to delete this task?</p>
                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                <p className="font-semibold text-gray-900">{deleteConfirmTask.title}</p>
                                {deleteConfirmTask.description && (
                                    <p className="text-sm text-gray-600 mt-1">{deleteConfirmTask.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirmTask(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deletingId === deleteConfirmTask._id}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {deletingId === deleteConfirmTask._id ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Task'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
