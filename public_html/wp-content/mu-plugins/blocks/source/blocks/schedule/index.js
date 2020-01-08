/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { Edit } from './edit';

export const NAME = 'wordcamp/schedule';
export const LABEL = __( 'Schedule', 'wordcamporg' );
export const ICON = 'schedule';

const supports = {
	align: [ 'wide', 'full' ],
};

export const SETTINGS = {
	title       : __( 'Schedule', 'wordcamporg' ),
		// todo rename files and user-facing labels to something like "full schedule" to avoid confusion w/ "live schedule" ?
	description : __( "Display your WordCamp's awesome schedule.", 'wordcamporg' ),
	icon        : ICON,
	category    : 'wordcamp',
	supports    : supports,
	edit        : Edit,
	save        : () => null,
};
