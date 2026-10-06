import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GTAContestAdminModal } from '../components/admin/modals/GTAContestAdminModal';

export function AdminGTAContestPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black">
            <GTAContestAdminModal
                isOpen={true}
                onClose={() => navigate('/admin')}
            />
        </div>
    );
}
