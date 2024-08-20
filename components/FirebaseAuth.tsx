'use client';
import { useAuth } from '@clerk/nextjs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { firebaseConfig } from '@/firebase';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function FirebaseAuth({
	children,
}: {
	children: React.ReactNode;
}) {
	const { getToken, userId } = useAuth();
	const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);

	useEffect(() => {
		const signIntoFirebaseWithClerk = async () => {
			if (userId) {
				try {
					const token = await getToken({ template: 'integration_firebase' });
					if (token) {
						const userCredentials = await signInWithCustomToken(auth, token);
						console.log(
							'User authenticated with Firebase:',
							userCredentials.user
						);
						setIsFirebaseAuthenticated(true);
					}
				} catch (error) {
					console.error('Error signing into Firebase:', error);
				}
			}
		};

		signIntoFirebaseWithClerk();
	}, [getToken, userId]);

	if (!userId) {
		return <p>Please sign in to access this page.</p>;
	}

	if (!isFirebaseAuthenticated) {
		return <p>Authenticating with Firebase...</p>;
	}

	return <>{children}</>;
}
