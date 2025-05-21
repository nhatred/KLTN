import { BookOpen01Icon, Delete01Icon, FileEditIcon, FilterHorizontalIcon, Search01Icon, UserIcon, ViewIcon, Calendar03Icon, Add01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import React, { useState, useMemo } from 'react';


interface Exam {
    id: string;
    title: string;
    subject: string;
    grade: string;
    createdAt: string;
    questionCount: number;
    description?: string;
    duration?: number; // in minutes
}

interface CreateExamForm {
    title: string;
    subject: string;
    grade: string;
    description: string;
    duration: number;
}

export default function ExamBank() {
    // Mock data for demonstration
    const [exams, setExams] = useState<Exam[]>([
        {
            id: '1',
            title: 'Đề thi Toán học cuối kỳ I',
            subject: 'Toán học',
            grade: '12',
            createdAt: '2024-01-15',
            questionCount: 50,
            description: 'Đề thi toán học lớp 12 cuối học kỳ I',
            duration: 90
        },
        {
            id: '2',
            title: 'Đề thi Vật lý chương 1',
            subject: 'Vật lý',
            grade: '11',
            createdAt: '2024-01-10',
            questionCount: 30,
            description: 'Kiểm tra chương 1: Dao động cơ',
            duration: 45
        },
        {
            id: '3',
            title: 'Đề thi Hóa học giữa kỳ',
            subject: 'Hóa học',
            grade: '10',
            createdAt: '2024-01-08',
            questionCount: 40,
            description: 'Đề thi giữa kỳ môn Hóa học lớp 10',
            duration: 60
        }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [formData, setFormData] = useState<CreateExamForm>({
        title: '',
        subject: '',
        grade: '',
        description: '',
        duration: 60
    });

    const subjects = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Văn học'];
    const grades = ['10', '11', '12'];

    // Filtered and sorted exams
    const filteredExams = useMemo(() => {
        let filtered = exams.filter(exam => {
            const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSubject = !selectedSubject || exam.subject === selectedSubject;
            const matchesGrade = !selectedGrade || exam.grade === selectedGrade;
            
            return matchesSearch && matchesSubject && matchesGrade;
        });

        // Sort exams
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'name':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [exams, searchTerm, selectedSubject, selectedGrade, sortBy]);

    const handleCreateExam = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            title: '',
            subject: '',
            grade: '',
            description: '',
            duration: 60
        });
    };

    const handleSubmitExam = () => {
        if (!formData.title || !formData.subject || !formData.grade) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        const newExam: Exam = {
            id: Date.now().toString(),
            title: formData.title,
            subject: formData.subject,
            grade: formData.grade,
            description: formData.description,
            duration: formData.duration,
            createdAt: new Date().toISOString().split('T')[0],
            questionCount: 0
        };

        setExams(prev => [newExam, ...prev]);
        handleCloseModal();
    };

    const handleDeleteExam = (examId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đề thi này?')) {
            setExams(prev => prev.filter(exam => exam.id !== examId));
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 pt-32">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Ngân Hàng Đề Thi</h1>
                    <p className="text-gray-600">Quản lý và tổ chức các đề thi của bạn</p>
                </div>

                {/* Search and Filter Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-wrap gap-4 mb-4">
                        {/* Search */}
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <HugeiconsIcon icon={Search01Icon} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm đề thi..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-32"
                        >
                            <option value="">Tất cả môn học</option>
                            {subjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>

                        <select
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-32"
                        >
                            <option value="">Tất cả khối lớp</option>
                            {grades.map(grade => (
                                <option key={grade} value={grade}>Lớp {grade}</option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="name">Theo tên</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <button
                            onClick={handleCreateExam}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                           <HugeiconsIcon icon={Add01Icon} />
                            Tạo đề thi mới
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tổng đề thi</p>
                                <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
                            </div>
                            <HugeiconsIcon icon={BookOpen01Icon} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Kết quả tìm kiếm</p>
                                <p className="text-2xl font-bold text-gray-900">{filteredExams.length}</p>
                            </div>
                            <HugeiconsIcon icon={FilterHorizontalIcon} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Môn học</p>
                                <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                            </div>
                            <HugeiconsIcon icon={BookOpen01Icon} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Khối lớp</p>
                                <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
                            </div>
                            <HugeiconsIcon icon={UserIcon} />
                        </div>
                    </div>
                </div>

                {/* Exam List */}
                {filteredExams.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <HugeiconsIcon icon={BookOpen01Icon} className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy đề thi</h3>
                        <p className="text-gray-600 mb-6">Thử điều chỉnh bộ lọc hoặc tạo đề thi mới</p>
                        <button
                            onClick={handleCreateExam}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Tạo đề thi đầu tiên
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExams.map((exam) => (
                            <div
                                key={exam.id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{exam.title}</h3>
                                    <div className="flex gap-1">
                                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                            <HugeiconsIcon icon={ViewIcon} />
                                        </button>
                                        <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                                           <HugeiconsIcon icon={FileEditIcon} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteExam(exam.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                           <HugeiconsIcon icon={Delete01Icon} />
                                        </button>
                                    </div>
                                </div>
                                
                                {exam.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{exam.description}</p>
                                )}
                                
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <HugeiconsIcon icon={BookOpen01Icon} className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Môn: </span>
                                        <span className="font-medium">{exam.subject}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <HugeiconsIcon icon={UserIcon} className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Khối: </span>
                                        <span className="font-medium">Lớp {exam.grade}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <HugeiconsIcon icon={Calendar03Icon} className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Tạo: </span>
                                        <span className="font-medium">{formatDate(exam.createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Số câu hỏi: <span className="font-medium">{exam.questionCount}</span></span>
                                        {exam.duration && <span className="text-gray-600">Thời gian: <span className="font-medium">{exam.duration} phút</span></span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên đề thi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Môn học</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khối lớp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số câu</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredExams.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                                            {exam.description && (
                                                <div className="text-sm text-gray-500">{exam.description}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Lớp {exam.grade}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.questionCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(exam.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button className="text-blue-600 hover:text-blue-900">
                                                    <HugeiconsIcon icon={ViewIcon} />
                                                </button>
                                                <button className="text-green-600 hover:text-green-900">
                                                    <HugeiconsIcon icon={FileEditIcon} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteExam(exam.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <HugeiconsIcon icon={Delete01Icon} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create Exam Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-96 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Tạo đề thi mới</h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên đề thi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nhập tên đề thi"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Môn học <span className="text-red-500">*</span>
                                        </label>
                                        <select 
                                            value={formData.subject}
                                            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Chọn môn học</option>
                                            {subjects.map(subject => (
                                                <option key={subject} value={subject}>{subject}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Khối lớp <span className="text-red-500">*</span>
                                        </label>
                                        <select 
                                            value={formData.grade}
                                            onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Chọn khối lớp</option>
                                            {grades.map(grade => (
                                                <option key={grade} value={grade}>Lớp {grade}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Mô tả ngắn về đề thi"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Thời gian làm bài (phút)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="15"
                                        max="300"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSubmitExam}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Tạo đề thi
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}