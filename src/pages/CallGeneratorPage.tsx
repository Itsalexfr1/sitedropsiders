import { useNavigate } from 'react-router-dom';
import { IncomingCallGenerator } from './IncomingCallGenerator';

export const CallGeneratorPage = () => {
    const navigate = useNavigate();

    return (
        <IncomingCallGenerator 
            isOpen={true} 
            onClose={() => navigate(-1)} 
        />
    );
};
