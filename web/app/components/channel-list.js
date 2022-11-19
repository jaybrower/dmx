import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ChannelListComponent extends Component {
    @action
    changeChannelValue(channel, evt) {
        alert(`Changing value for channel #${channel + 1} to ${evt.target.value}`);
    }
}