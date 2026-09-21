// Enhanced orb with provider pulse + MediaPipe vision tie-in
const Orb = ({ status }) => <div className="orb neon-pulse" style={{boxShadow: `0 0 40px ${statusColor(status)}`}} />;