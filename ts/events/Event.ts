/**
 * Created by Keita Watanabe on 2016/09/30.
 *
 * createJSのEventクラスの設計が優秀なので、TypeScript2.0でリライトし、
 * Eventクラス単体で使用／拡張できるようにしている。
 *
 * ベースをTS2.0で作り変えているが、createJSのEventクラスと同じように動作する。
 * 拡張を可能にすることで、カスタムイベントをクラスとして定義できるように作られている。
 *
 * Example:
 * class YourCustomEvent extends events.Event {
 *     constructor(type:string, bubbles = null, cancelable = null) {
 *         super(type, bubbles, cancelable);
 *         // do stuff...
 *     }
 * }
 *
 */

namespace events {
	/**
	 * Contains properties and methods shared by all events for use with
	 * EventDispatcher.
	 *
	 * Note that Event objects are often reused, so you should never
	 * rely on an event object's state outside of the call stack it was received in.
	 * @class Event
	 */
	export class Event {

		////// Public Properties: /////////////////////////

		/**
		 * The type of event.
		 **/
		public type: string;

		/**
		 * Indicates whether the event will bubble through the display list.
		 */
		public bubbles: boolean;

		/**
		 * Indicates whether the default behaviour of this event can be cancelled via preventDefault.
		 * This is set via the Event constructor.
		 */
		public cancelable: boolean;

		/**
		 * The object that generated an event.
		 */
		public target: any;

		/**
		 * The current target that a bubbling event is being dispatched from. For non-bubbling events, this will
		 * always be the same as target. For example, if childObj.parent = parentObj, and a bubbling event
		 * is generated from childObj, then a listener on parentObj would receive the event with
		 * target=childObj (the original target) and currentTarget=parentObj (where the listener was added).
		 */
		public currentTarget: any;

		/**
		 * For bubbling events, this indicates the current event phase:<OL>
		 * 	<LI> capture phase: starting from the top parent to the target</LI>
		 * 	<LI> at target phase: currently being dispatched from the target</LI>
		 * 	<LI> bubbling phase: from the target to the top parent</LI>
		 * </OL>
		 */
		public eventPhase: number = 0;

		/**
		 * The epoch time at which this event was created.
		 */
		public timeStamp: number = 0;

		/**
		 * Indicates if preventDefault has been called on this event.
		 */
		public defaultPrevented: boolean = false;

		/**
		 * Indicates if stopPropagation or stopImmediatePropagation has been called on this event.
		 */
		public propagationStopped: boolean = false;

		/**
		 * Indicates if stopImmediatePropagation has been called on this event.
		 */
		public immediatePropagationStopped: boolean = false;

		/**
		 * Indicates if remove has been called on this event.
		 */
		public removed: boolean;

		/**
		 * Save and deliver the values on this event.
		 * If you want to have a number of properties on this event's self, Use "set" method.
		 * 
		 */
		 public value: any;


		////// constructor: /////////////////////////

		/**
		 * constructor
		 * @param {String} type The event type.
		 * @param {Boolean} bubbles Indicates whether the event will bubble through the display list.
		 * @param {Boolean} cancelable Indicates whether the default behaviour of this event can be cancelled.
		 * @constructor
		 **/
		constructor(type:string, bubbles:boolean = null, cancelable:boolean = null) {
			this.type = type;
			this.bubbles = !!bubbles;
			this.cancelable = !!cancelable;
			this.timeStamp = (new Date()).getTime();
		}


		////// public methods: /////////////////////////

		/**
		 * Sets defaultPrevented to true.
		 * Mirrors the DOM event standard.
		 **/
		public preventDefault():void
		{
			this.defaultPrevented = true;
		}

		/**
		 * Sets propagationStopped to true.
		 * Mirrors the DOM event standard.
		 **/
		public stopPropagation():void
		{
			this.propagationStopped = true;
		}

		/**
		 * Sets propagationStopped and immediatePropagationStopped to true.
		 * Mirrors the DOM event standard.
		 **/
		public stopImmediatePropagation():void
		{
			this.immediatePropagationStopped = this.propagationStopped = true;
		}

		/**
		 * Causes the active listener to be removed via removeEventListener();
		 *
		 * myBtn.addEventListener("click", function(evt) {
		 * 			// do stuff...
		 * 			evt.remove(); // removes this listener.
		 * 		});
		 **/
		public remove():void
		{
			this.removed = true;
		}

		/**
		 * Returns a clone of the Event instance.
		 * @method clone
		 * @return {Event} a clone of the Event instance.
		 **/
		public clone()
		{
			return new Event(this.type, this.bubbles, this.cancelable);
		}

		/**
		 * Provides a chainable shortcut method for setting a number of properties on the instance.
		 *
		 * @method set
		 * @param {Object} props A generic object containing properties to copy to the instance.
		 * @return {Event} Returns the instance the method is called on (useful for chaining calls.)
		 */
		public set(props)
		{
			for(var n in props)
			{
				if(props.hasOwnProperty(n))
				{
					this[n] = props[n];
				}
			}

			return this;
		}


		/**
		 * Returns a string representation of this object.
		 * @method toString
		 * @return {String} a string representation of the instance.
		 **/
		public toString()
		{
			return "[Event (type=" + this.type + ")]";
		}

	}
}