/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { gmdate } from '@wordpress/date';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Render time headings and session groups.
 *
 * @param {Array} sessions
 * @param {Array} allTracks
 * @param {string} timeFormat
 *
 * @return {Element}
 */
export function Sessions( { sessions, allTracks, timeFormat } ) {
	const sessionsByTimeSlot = groupSessionsByTimeSlot( sessions );
	const timeGroups = [];
	const sortedKeys = Object.keys( sessionsByTimeSlot ).sort();

	for ( let i = 0; i < sortedKeys.length; i++ ) {
		const key       = sortedKeys[ i ];
		const startTime = parseInt( key );
		const endTime   = parseInt( sortedKeys[ i + 1 ] );
			// this is wrong, the end time should be the end time of the session, not the start time of the next session
			// should be same most of time, but wont be when user error, and it's important to show that there's an error

		// gmdate() is used because the timestamp is already in the local timezone.
		const gridRow = `
			time-${ gmdate( 'Hi', startTime ) } /
			time-${ gmdate( 'Hi', startTime ) }
		`;

		const classes = classnames(
			'wordcamp-schedule__time-slot-header',
			sessionsByTimeSlot[ key ].length ? 'is-start-time' : 'is-end-time'
		);

		timeGroups.push(
			<h3
				key={ startTime }
				className={ classes }
				style={ { gridRow } }
			>
				{ gmdate( timeFormat, startTime ) } - { gmdate( timeFormat, endTime ) }
			</h3>
		);

		for ( const session of sessionsByTimeSlot[ key ] ) {
			timeGroups.push(
				<Session
					key={ session.id }
					session={ session }
					allTracks={ allTracks }
				/>
			);
		}
	}

	// Remove the last row, to avoid printing an empty slot at the end of the Grid schedule.
	const finalTimeSlot = sortedKeys[ sortedKeys.length - 1 ];

	if ( 0 === sessionsByTimeSlot[ finalTimeSlot ].length ) {
		timeGroups.pop();
	}

	return (
		<Fragment>
			{ timeGroups }
		</Fragment>
	);
}

/**
 * Group sessions by their time slot.
 *
 * @param {Array} ungroupedSessions
 *
 * @return {Array}
 */
function groupSessionsByTimeSlot( ungroupedSessions ) {
	return ungroupedSessions.reduce(
		( groups, session ) => {
			const { startTime, endTime } = session.derived;

			groups[ startTime ] = groups[ startTime ] || [];
			groups[ startTime ].push( session );

			/*
			 * Add row marker for end time.
			 *
			 * The end of one session may be the start of another session, but not necessarily. Without an explicit
			 * end line, the cell would extend beyond it's actual end time.
			 *
			 * This looks odd on some schedules, but that can be fixed/mitigated with CSS for those camps. The raw
			 * data/markup needs this, so that all camps have the flexibility of introducing chronological gaps between
			 * sessions within the same track.
			 */
			groups[ endTime ] = groups[ endTime ] || [];

			return groups;
		},
		{}
	);
}

/**
 * Render an individual session.
 *
 * @param {object} session
 * @param {Array} allTracks
 *
 * @return {Element}
 */
function Session( { session, allTracks } ) {
	const showCategories = true; // todo pull from dynamic attributes
	const { id, slug, title } = session;
	const { startTime, endTime } = session.derived;
	const { tracks: assignedTracks, categories } = session.derived;
	const speakers = session._embedded.speakers || [];
	const editUrl = `/wp-admin/post.php?post=${ id }&action=edit`;

	const classes = classnames(
		'wordcamp-schedule__session',
		`wordcamp-schedule__session-type-${ session.meta._wcpt_session_type }`,
		{ 'is-spanning-tracks': assignedTracks.length > 1 }
	);

	const implicitTrackId = 0; // See print_dynamic_styles().
		// todo probably move ^ into higher component and share w/ the js that prints the dynamic css, when that gets added
	const startTrackId = assignedTracks.length ? assignedTracks[ 0 ].id : implicitTrackId;
	let endTrackId = assignedTracks.length ? assignedTracks[ assignedTracks.length - 1 ].id : implicitTrackId;

	// Spanning non-contiguous tracks isn't supported by CSS Grid as of August 2019.
	const spansNonContiguousTracks = sessionSpansNonContiguousTracks(
		assignedTracks.map( track => track.id ),
		allTracks.map( track => track.id )
	);

	if ( spansNonContiguousTracks ) {
		endTrackId = startTrackId;
	}

	//* add a warning if a session overlaps another session in the same track
 //*      e.g., A is from 9:30 - 10:30, and B is from 10:15 - 11.
 //*      it can be hard to visually detect that, and confusing as to why it's happening
 //
	const overlapsAnother = sessionOverlapsAnother(
		assignedTracks.map( track => track.id )
	);

	const gridColumn = `
		wordcamp-schedule-track-${ startTrackId } /
		wordcamp-schedule-track-${ endTrackId }
	`;

	const gridRow = `
		time-${ gmdate( 'Hi', startTime ) } /
		time-${ gmdate( 'Hi', endTime ) }
	`;

	return (
		<div
			className={ classes }
			data-wordcamp-schedule-session-id={ id }
			data-wordcamp-schedule-session-slug={ slug }
			data-wordcamp-schedule-session-tracks={ assignedTracks && assignedTracks.map( track => track.slug ) }
			data-wordcamp-schedule-session-categories={ categories && categories.map( category => category.slug ) }
			style={ { gridColumn, gridRow } }
		>
			<h4 className="wordcamp-schedule__session-title">
				{ /*
				  * Link to the edit screen because, when they're in this context, it's more likely that the
				  * organizer will want to edit a session than view it.
				  *
				  * These are _only_ opened in new tabs because this is in the editor. They should _not_ do that
				  * on the front-end, because that's an anti-pattern that hurts UX by taking control away from the
				  * user.
				  */ }
				<a href={ editUrl } target="_blank" rel="noopener noreferrer">
					{ title.rendered }
				</a>
			</h4>

			{ speakers &&
				<ul className="wordcamp-schedule__session-speakers">
					{ speakers.map( speaker => {
						if ( ! speaker.id ) {
							return null;
						}

						const speakerEditUrl = `/wp-admin/post.php?post=${ speaker.id }&action=edit`;

						return (
							<li key={ speaker.id }>
								{ /* See note in title regarding target. */ }
								<a href={ speakerEditUrl } target="_blank" rel="noopener noreferrer">
									{ speaker.title.rendered }
								</a>
							</li>
						);
					} ) }
				</ul>
			}

			{ assignedTracks &&
				<ul className="wordcamp-schedule__session-tracks">
					{ assignedTracks && assignedTracks.map( track => {
						return (
							<li key={ track.id }>
								{ track.name }
							</li>
						);
					} ) }
				</ul>
			}

			{ showCategories && categories.length > 0 &&
				<ul className="wordcamp-schedule__session-category">
					{ categories.map( category => {
						return (
							<li key={ category.id }>
								{ category.slug }
							</li>
						);
					} ) }
				</ul>
			}

			{ spansNonContiguousTracks &&
				<p className="notice notice-warning notice-spans-non-contiguous-tracks">
					{ __( 'Warning: Sessions cannot span non-contiguous tracks.', 'wordcamporg' ) }
				</p>
			}

			{ overlapsAnother &&
				<p className="notice notice-warning notice-spans-non-contiguous-tracks">
					{ __( 'Warning: This overlaps another session in the same track.', 'wordcamporg' ) }
				</p>
			}
		</div>
	);
}

/**
 * Determine if the session spans non-contiguous tracks.
 *
 * If the assigned sessions are contiguous, then looping through them will not flip the toggle more than once.
 * If it does, we can tell that there's a gap.
 *
 * This assumes that both arrays are sorted using the same criteria, and that their order matches the order in
 * which they appear in the schedule.
 *
 * @param {Array} assignedTrackIds Tracks that the given session is assigned to.
 * @param {Array} allTrackIds
 *
 * @return {boolean}
 */
function sessionSpansNonContiguousTracks( assignedTrackIds, allTrackIds ) {
	let toggleCount = 0;
	let previousWasAssigned = false;
	let currentIsAssigned;

	if ( assignedTrackIds.length < 2 || isEqual( assignedTrackIds, allTrackIds ) ) {
		return false;
	}

	allTrackIds.forEach( ( trackId ) => {
		currentIsAssigned = assignedTrackIds.includes( trackId );

		if ( previousWasAssigned !== currentIsAssigned ) {
			toggleCount++;
			previousWasAssigned = currentIsAssigned;
		}
	} );

	return toggleCount > 2;
}


// *      might be able to do something similar to sessionSpansNonContiguousTracks()
// *      need to account for sessions that are in multiple tracks
//// todo
function sessionOverlapsAnother( assignedTrackIds ) {
	// what to pass in?
		// caller doesn't have access to other sessions
		// maybe use context here?

	// test w/ day that has no sessions

	// get all of the sessions in each track (this will contain dups if sessino is in more than 1 track )
		// for each track
			// for each session
				// the compare times to check if overlap

	// or maybe diff approach, pass in the session, and the session that came before it, and the session that comes after it
		// the compare times to check if overlap


	return false;
}
