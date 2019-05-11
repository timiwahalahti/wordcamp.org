/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
const { Component } = wp.element;

/**
 * Internal dependencies
 */
import { AvatarImage }                                from '../../components/image';
import { BlockNoContent, ItemTitle, ItemHTMLContent } from '../../components/block-content';
import { PostList }                                   from '../../components/post-list';
import { filterEntities }                             from '../../data';
import { BlockContext }                               from './block-context';

/**
 * Component for displaying the block content.
 */
export class BlockContent extends Component {
	/**
	 * Run additional operations during component initialization.
	 *
	 * @param {Object} props
	 */
	constructor( props ) {
		super( props );

		this.getFilteredPosts = this.getFilteredPosts.bind( this );
	}

	/**
	 * Filter and sort the content that will be rendered.
	 *
	 * @returns {Array}
	 */
	getFilteredPosts() {
		const { attributes, entities } = this.context;
		const { wcb_organizer: posts } = entities;
		const { mode, item_ids, sort } = attributes;

		const args = {};

		if ( Array.isArray( item_ids ) && item_ids.length > 0 ) {
			args.filter = [
				{
					fieldName  : mode === 'wcb_organizer' ? 'id' : 'organizer_team',
					fieldValue : item_ids,
				},
			];
		}

		args.sort = sort;

		return filterEntities( posts, args );
	}

	/**
	 * Render the block content.
	 *
	 * @return {Element}
	 */
	render() {
		const { attributes } = this.context;
		const { show_avatars, avatar_size, avatar_align, content } = attributes;

		const posts     = this.getFilteredPosts();
		const isLoading = ! Array.isArray( posts );
		const hasPosts  = ! isLoading && posts.length > 0;

		if ( isLoading || ! hasPosts ) {
			return (
				<BlockNoContent loading={ isLoading } />
			);
		}

		return (
			<PostList
				attributes={ attributes }
				className="wordcamp-organizers-block"
			>
				{ posts.map( ( post ) => /* Note that organizer posts are not 'public', so there are no permalinks. */
					<div
						key={ post.slug }
						className={ classnames( 'wordcamp-organizer', 'wordcamp-organizer-' + post.slug.trim() ) }
					>
						<ItemTitle
							className="wordcamp-organizer-title"
							headingLevel={ 3 }
							title={ post.title.rendered.trim() }
						/>

						{ show_avatars &&
							<AvatarImage
								className={ classnames( 'align-' + avatar_align ) }
								name={ post.title.rendered.trim() || '' }
								size={ avatar_size }
								url={ post.avatar_urls[ '24' ] }
							/>
						}

						{ ( 'none' !== content ) &&
							<ItemHTMLContent
								className={ classnames( 'wordcamp-organizer-content-' + content ) }
								content={  'full' === content ? post.content.rendered.trim() : post.excerpt.rendered.trim() }
							/>
						}
					</div>
				) }
			</PostList>
		);
	}
}

BlockContent.contextType = BlockContext;
